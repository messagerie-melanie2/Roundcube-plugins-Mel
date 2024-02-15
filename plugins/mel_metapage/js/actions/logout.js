$(document).ready(() => {
    if (!!(rcmail.env.da_logout_message || false)) {
        const margin = 15;
        $('#main-login-card .card-body').prepend($(`<p class="text-center">
        Connexion impossible pour des questions de sécurité.</p>
<span style="display:block;margin-top:${margin}px"></span>
<blockquote>Bonjour,
<span style="display:block;margin-top:${margin}px"></span>
La double authentification est obligatoire afin d'accéder à votre BNum depuis internet pour votre compte.
Afin de la mettre en place, merci de vous connecter depuis le RIE ou en VPN puis de vous rendre à l'adresse suivante :
<a href="${mel_metapage.Functions.url('settings', 'plugin.mel_doubleauth', {_force_bnum:1})}">Double Authentification</a>
<span style="display:block;margin-top:${margin}px"></span>
Bonne journée.
       </blockquote> `));
        rcmail.env.da_logout_message = undefined;
    }
})