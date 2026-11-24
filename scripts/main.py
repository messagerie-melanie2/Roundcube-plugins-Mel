# coding=utf-8
"""Posts a deployment message to a Tchap room through the Bot-Gmcd bot.

The channel depends on the deployed branch:
- prod:    version + changelog written by Albert (French State LLM API, OpenAI-compatible) from the
           treated Mantis issues targeted on the version and the GitHub PRs merged for it
           (PRs whose base branch is ``dwp-<version>`` in Roundcube-plugins-Mel);
           + theoretical date of the next production release (a Wednesday, one month later);
- recette: version + counter of the Mantis issues targeted on the version (treated / remaining)
           + link to Kiwi.
Other branches post nothing.

Run by the launch-python-script job of cicd-yaml, from bnum/scripts:
    python3 -m main

Environment:
    BNUM_NOTIF_TCHAP_BOT_URL           Tchap bot URL (same as the tchap plugin's tchap_bot_url)
    BNUM_NOTIF_TCHAP_WEBHOOK_PROD      webhook id of the prod room (masked CI/CD variable)
    BNUM_NOTIF_TCHAP_WEBHOOK_RECETTE   webhook id of the recette room (masked CI/CD variable)
    BNUM_NOTIF_CHANNEL                 optional, forces the channel (prod|recette), e.g. to test from preprod
    BNUM_NOTIF_GITHUB_REPO             GitHub repository (default: messagerie-melanie2/Roundcube-plugins-Mel)
    BNUM_NOTIF_GITHUB_TOKEN            optional GitHub token (raises the API rate limit)
    BNUM_NOTIF_MANTIS_URL              Mantis base URL (e.g. https://host/mantis); no Mantis section if empty
    BNUM_NOTIF_MANTIS_TOKEN            Mantis API token (masked CI/CD variable)
    BNUM_NOTIF_MANTIS_PROJECT_ID       Mantis project id
    BNUM_NOTIF_MANTIS_TREATED_STATUS   status id from which an issue counts as treated (default 80 = resolved)
    API_KEY_ALBERT                     Albert API key (masked CI/CD variable); plain list if empty
    BNUM_NOTIF_ALBERT_URL              Albert API base URL (default: https://albert.api.etalab.gouv.fr/v1)
    BNUM_NOTIF_ALBERT_MODEL            optional model id; default: first text-generation model of /models
    CI_COMMIT_REF_NAME                 deployed branch (predefined GitLab CI variable)
"""
import calendar
import os
import re
import sys
from datetime import date, datetime
from zoneinfo import ZoneInfo

import requests

VERSION_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "version.php")
DEFAULT_GITHUB_REPO = "messagerie-melanie2/Roundcube-plugins-Mel"
KIWI_URL = "https://analyse-mel.m2.e2.rie.gouv.fr/kiwi/"
MAX_CHANGELOG_ITEMS = 50
DEFAULT_TREATED_STATUS = 80  # Mantis "resolved"; "closed" (90) is above it
MANTIS_PAGE_SIZE = 250
CHANNELS = ("prod", "recette")
DEFAULT_ALBERT_URL = "https://albert.api.etalab.gouv.fr/v1"
MAX_DESCRIPTION_CHARS = 600
MAX_NOTE_CHARS = 300
MAX_NOTES_PER_ISSUE = 2
CHANGELOG_SECTIONS = ("✨ **Nouveautés**", "🛠️ **Améliorations**", "🐞 **Corrections**")
SUMMARY_PROMPT = """Tu rédiges le changelog d'une mise en production du Bnum, la messagerie web des agents \
du ministère, pour des utilisateurs non techniques, à partir des tickets Mantis et des titres de PR fournis.

Contenu :
- Décris ce que l'utilisateur voit ou peut faire, pas comment c'est codé.
- Regroupe les changements similaires en une seule puce.
- N'invente rien : seulement ce qui figure dans les tickets et les PR.
- Ne cite ni numéro de ticket ou de PR, ni nom de personne, ni adresse mail, ni détail technique interne
  (nom de fichier, de classe, de plugin, de branche, de serveur).

Mise en forme, à respecter EXACTEMENT :
- Au plus trois sections, dans cet ordre et avec ces titres exacts, chacun seul sur sa ligne :
  ✨ **Nouveautés**
  🛠️ **Améliorations**
  🐞 **Corrections**
- Omets une section qui n'aurait aucune puce.
- Sous chaque titre, des puces commençant par « - » (tiret puis espace), sans sous-puce.
- Chaque puce : une seule phrase de 20 mots au plus, commençant par une majuscule, sans point final,
  sans gras ni italique, sans emoji.
- Entre 3 et 8 puces au total.
- Une ligne vide entre deux sections, aucune ligne vide entre les puces.
- Rien d'autre : pas d'introduction, pas de conclusion, pas de titre « Changelog », pas de tableau,
  pas de bloc de code.

Exemple de réponse attendue :
✨ **Nouveautés**
- Possibilité d'insérer une image dans la signature des messages

🛠️ **Améliorations**
- Recherche plus rapide dans les grandes boîtes aux lettres
- Affichage du calendrier plus lisible sur petit écran

🐞 **Corrections**
- Les pièces jointes volumineuses s'envoient à nouveau correctement"""


def read_version(path: str = VERSION_FILE) -> str:
    with open(path, encoding="utf-8") as file:
        match = re.search(r"const\s+VERSION\s*=\s*'([^']+)'", file.read())
    return match.group(1) if match else "inconnue"


# ---------------------------------------------------------------- GitHub

def version_names(version: str) -> list:
    """Names under which a version may appear: 26.9-pre.1 -> [26.9-pre.1, 26.9]."""
    return list(dict.fromkeys([version, version.split("-", 1)[0]]))


def base_branches(version: str) -> list:
    """GitHub base branches of a version: 26.9-pre.1 -> [dwp-26.9-pre.1, dwp-26.9]."""
    return [f"dwp-{v}" for v in version_names(version)]


def fetch_merged_pull_requests(repo: str, base: str, token: str = "") -> list:
    """Merged PRs targeting ``base``, newest first."""
    headers = {"Accept": "application/vnd.github+json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    url = f"https://api.github.com/repos/{repo}/pulls"
    params = {"state": "closed", "base": base, "per_page": 100}
    merged = []
    while url:
        response = requests.get(url, headers=headers, params=params, timeout=30)
        response.raise_for_status()
        merged += [pr for pr in response.json() if pr.get("merged_at")]
        url, params = response.links.get("next", {}).get("url"), None
    return sorted(merged, key=lambda pr: pr["merged_at"], reverse=True)


def pull_requests_for_version(repo: str, version: str, token: str = ""):
    """PRs of the version, or None if GitHub could not be reached."""
    try:
        return [pr for base in base_branches(version) for pr in fetch_merged_pull_requests(repo, base, token)]
    except requests.RequestException as error:
        print(f"Could not fetch GitHub pull requests: {error}")
        return None


# ---------------------------------------------------------------- Mantis

def fetch_issues_for_version(url: str, token: str, project_id: str, version: str) -> list:
    """Issues of the project whose target version is ``version`` (or its name without suffix).

    The Mantis REST API cannot filter on the target version: all project issues are read, page by page.
    """
    names = set(version_names(version))
    matching, page = [], 1
    while True:
        response = requests.get(
            f"{url.rstrip('/')}/api/rest/issues",
            headers={"Authorization": token},
            params={"project_id": project_id, "page_size": MANTIS_PAGE_SIZE, "page": page},
            timeout=60,
        )
        response.raise_for_status()
        issues = response.json().get("issues", [])
        matching += [i for i in issues if (i.get("target_version") or {}).get("name") in names]
        if len(issues) < MANTIS_PAGE_SIZE:
            return sorted(matching, key=lambda i: int(i["id"]))
        page += 1


def issues_for_version(env, version: str):
    """Mantis issues of the version; None on error; "disabled" when Mantis is not configured."""
    url, token = env.get("BNUM_NOTIF_MANTIS_URL", ""), env.get("BNUM_NOTIF_MANTIS_TOKEN", "")
    project_id = env.get("BNUM_NOTIF_MANTIS_PROJECT_ID", "")
    if not (url and token and project_id):
        print("Mantis not configured (BNUM_NOTIF_MANTIS_URL / _TOKEN / _PROJECT_ID)")
        return "disabled"
    try:
        return fetch_issues_for_version(url, token, project_id, version)
    except (requests.RequestException, ValueError) as error:
        print(f"Could not fetch Mantis issues: {error}")
        return None


def is_treated(issue: dict, treated_status: int = DEFAULT_TREATED_STATUS) -> bool:
    """An issue is treated once its status id reaches ``treated_status`` (resolved, closed)."""
    return int((issue.get("status") or {}).get("id", 0)) >= treated_status


def count_issues(issues, treated_status: int = DEFAULT_TREATED_STATUS) -> tuple:
    """(treated, remaining) issues."""
    treated = sum(1 for i in issues if is_treated(i, treated_status))
    return treated, len(issues) - treated


def format_counter(issues, treated_status: int = DEFAULT_TREATED_STATUS) -> list:
    if issues == "disabled":
        return []
    if issues is None:
        return ["📊 _Compteur de tickets indisponible (erreur Mantis, voir les logs du job)._"]
    if not issues:
        return ["📊 _Aucun ticket Mantis ciblé sur cette version._"]
    treated, remaining = count_issues(issues, treated_status)
    return [f"📊 Tickets traités : **{treated} / {len(issues)}** ({remaining} restant{'s' if remaining > 1 else ''})"]


# ---------------------------------------------------------------- Albert summary

def _shorten(text: str, limit: int) -> str:
    text = re.sub(r"\s+", " ", text or "").strip()
    return text if len(text) <= limit else text[:limit].rstrip() + "…"


def describe_issues(issues, pull_requests=None) -> str:
    """Text sent to the model: title, description and last notes of each issue, then PR titles."""
    blocks = []
    for issue in issues:
        lines = [f"Ticket : {issue.get('summary', '')}"]
        if issue.get("description"):
            lines.append(f"Description : {_shorten(issue['description'], MAX_DESCRIPTION_CHARS)}")
        for note in (issue.get("notes") or [])[-MAX_NOTES_PER_ISSUE:]:
            if note.get("text"):
                lines.append(f"Note : {_shorten(note['text'], MAX_NOTE_CHARS)}")
        blocks.append("\n".join(lines))
    if pull_requests:
        blocks.append("Titres des PR :\n" + "\n".join(f"- {pr['title']}" for pr in pull_requests))
    return "\n\n".join(blocks)


def albert_model(base_url: str, headers: dict, env) -> str:
    if env.get("BNUM_NOTIF_ALBERT_MODEL"):
        return env["BNUM_NOTIF_ALBERT_MODEL"]
    response = requests.get(f"{base_url}/models", headers=headers, timeout=30)
    response.raise_for_status()
    models = [m["id"] for m in response.json().get("data", []) if m.get("type") == "text-generation"]
    if not models:
        raise ValueError("no text-generation model available on Albert")
    return models[0]


def summarize(env, text: str):
    """Changelog written by Albert, or None (no key, nothing to summarize, or error)."""
    key = env.get("API_KEY_ALBERT", "")
    if not key or not text:
        print("No Albert changelog (API_KEY_ALBERT not set or nothing to summarize)")
        return None
    base_url = env.get("BNUM_NOTIF_ALBERT_URL", DEFAULT_ALBERT_URL).rstrip("/")
    headers = {"Authorization": f"Bearer {key}"}
    try:
        model = albert_model(base_url, headers, env)
        print(f"Albert changelog with model {model} ({len(text)} characters sent)")
        response = requests.post(
            f"{base_url}/chat/completions",
            headers=headers,
            json={
                "model": model,
                "messages": [{"role": "system", "content": SUMMARY_PROMPT}, {"role": "user", "content": text}],
                "temperature": 0.1,
                "max_tokens": 4000,  # reasoning models (e.g. gpt-oss) spend tokens before answering
            },
            timeout=180,
        )
        response.raise_for_status()
        return changelog_from_response(response.json())
    except Exception as error:  # the changelog is optional: never fail the deployment because of it
        print(f"Could not get Albert changelog ({type(error).__name__}): {error}")
        return None


def changelog_from_response(data) -> str:
    """Text of the first choice of an OpenAI-compatible response; ValueError if there is none."""
    choices = (data or {}).get("choices") or [{}]
    choice = choices[0] or {}
    content = ((choice.get("message") or {}).get("content") or "").strip()
    if not content:
        raise ValueError(f"empty answer (finish_reason={choice.get('finish_reason')!r}, "
                         f"usage={(data or {}).get('usage')}): {str(data)[:300]}")
    return normalize_changelog(content)


def normalize_changelog(text: str) -> str:
    """Enforces the expected layout when the model drifts from it: known section titles, "- " bullets,
    one blank line between sections, no other line."""
    titles = {re.sub(r"[^a-zé]", "", t.lower()): t for t in CHANGELOG_SECTIONS}
    lines = []
    for raw in text.splitlines():
        line = raw.strip()
        key = re.sub(r"[^a-zé]", "", line.lower())
        if key in titles:  # a section title, whatever its emoji, bold or heading markers
            if lines:
                lines.append("")
            lines.append(titles[key])
        elif re.match(r"^([-*•+]|\d+[.)])\s+", line):  # a bullet, whatever its marker
            item = re.sub(r"^([-*•+]|\d+[.)])\s+", "", line).replace("**", "").strip().rstrip(".")
            if item:
                lines.append(f"- {item[0].upper()}{item[1:]}")
    return "\n".join(lines) if any(l.startswith("- ") for l in lines) else text


def format_changelog(summary, issues, pull_requests) -> list:
    """AI changelog; without it, the plain titles of the issues (or of the PRs)."""
    if summary:
        return ["**Changelog** _(généré par IA)_", summary]
    titles = [i.get("summary", "") for i in issues] or [pr["title"] for pr in pull_requests or []]
    if not titles:
        return ["_Changelog indisponible (aucun ticket ni PR trouvé, voir les logs du job)._"]
    lines = ["**Changelog**"] + [f"- {t}" for t in titles[:MAX_CHANGELOG_ITEMS]]
    if len(titles) > MAX_CHANGELOG_ITEMS:
        lines.append(f"- … et {len(titles) - MAX_CHANGELOG_ITEMS} autre(s)")
    return lines


# ---------------------------------------------------------------- Next release date

WEDNESDAY = 2
FRENCH_DAYS = ("lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche")
FRENCH_MONTHS = ("janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre")


def add_one_month(day: date) -> date:
    """Same day next month, clamped to the month's last day (31 Jan -> 28/29 Feb)."""
    year, month = (day.year + 1, 1) if day.month == 12 else (day.year, day.month + 1)
    return date(year, month, min(day.day, calendar.monthrange(year, month)[1]))


def next_release_date(deployed_on: date) -> date:
    """Theoretical next release: the first Wednesday on or after one month after the deployment."""
    target = add_one_month(deployed_on)
    return date.fromordinal(target.toordinal() + (WEDNESDAY - target.weekday()) % 7)


def french_date(day: date) -> str:
    return f"{FRENCH_DAYS[day.weekday()]} {day.day} {FRENCH_MONTHS[day.month - 1]} {day.year}"


def today() -> date:
    return datetime.now(ZoneInfo("Europe/Paris")).date()


# ---------------------------------------------------------------- Messages

def build_prod_message(version: str, changelog_lines, next_release: date = None) -> str:
    lines = [f"📦 **Bnum en production : {version}**", ""] + list(changelog_lines)
    if next_release:
        lines += ["", f"📅 Prochaine mise en production : **{french_date(next_release)}** _(date théorique)_"]
    return "\n".join(lines)


def build_recette_message(version: str, counter_lines) -> str:
    return "\n".join([f"🧪 **Bnum en recette : {version}**", ""] + list(counter_lines) + [f"🔗 Kiwi : {KIWI_URL}"])


def build_message(channel: str, version: str, env) -> str:
    issues = issues_for_version(env, version)
    treated_status = int(env.get("BNUM_NOTIF_MANTIS_TREATED_STATUS") or DEFAULT_TREATED_STATUS)
    if channel == "recette":
        return build_recette_message(version, format_counter(issues, treated_status))
    # Prod changelog: only the issues actually treated
    issue_list = [i for i in issues if is_treated(i, treated_status)] if isinstance(issues, list) else []
    pull_requests = pull_requests_for_version(
        env.get("BNUM_NOTIF_GITHUB_REPO", DEFAULT_GITHUB_REPO), version, env.get("BNUM_NOTIF_GITHUB_TOKEN", ""))
    summary = summarize(env, describe_issues(issue_list, pull_requests))
    return build_prod_message(version, format_changelog(summary, issue_list, pull_requests),
                              next_release_date(today()))


# ---------------------------------------------------------------- Tchap

def send_to_tchap(bot_url: str, webhook: str, message: str) -> None:
    response = requests.post(
        f"{bot_url.rstrip('/')}/api/webhook/post/{webhook}",
        json={"message": message, "message_format": "markdown", "message_raw": message.replace("**", "")},
        timeout=30,
    )
    response.raise_for_status()


def main() -> int:
    env = os.environ
    channel = env.get("BNUM_NOTIF_CHANNEL") or env.get("CI_COMMIT_REF_NAME", "")
    if channel not in CHANNELS:
        print(f"Branch '{channel}' has no Tchap channel ({', '.join(CHANNELS)}): nothing to post")
        return 0

    message = build_message(channel, read_version(), env)
    print(f"[{channel}]\n{message}")

    bot_url = env.get("BNUM_NOTIF_TCHAP_BOT_URL", "")
    webhook = env.get(f"BNUM_NOTIF_TCHAP_WEBHOOK_{channel.upper()}", "")
    if not bot_url or not webhook or "TO_BE_DEFINED" in bot_url:
        print(f"Tchap not configured (BNUM_NOTIF_TCHAP_BOT_URL / BNUM_NOTIF_TCHAP_WEBHOOK_{channel.upper()}): "
              "message not sent")
        return 0

    send_to_tchap(bot_url, webhook, message)
    print(f"Message sent to Tchap ({channel})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
