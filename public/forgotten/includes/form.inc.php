<h3>Mot de passe oublié</h3>
<div>
    <div class="message">
        <p>Quel type de compte utilisez-vous ?</p>
    </div>
    <ul class="actions">
        <li role="button" aria-pressed="false">
            <span>Le Bnum vous sert à consulter vos mails, votre agenda, vos contacts et vos espaces de travail.</span>
            <div class="content">
                <p>Vous devez vous tourner vers votre assistance locale, de proximité, informatique ... voici quelques pistes pour vous aider :</p>
                <ul>
                    <li>Pour les personnels de l'Enseignement Agricole, votre assistance est assurée par le service informatique de votre établissement qui pourra au besoin solliciter le DRTIC,</li>
                    <li>Pour les autres personnels du MASA, vous pouvez solliciter l'assistance en envoyant un mel à outilscollaboratifs,</li>
                    <li>Pour les personnels du MTE ou autres administrations, vous pouvez solliciter votre service informatique local.</li>
                </ul>
                <p>En cas de problème, rendez-vous sur le <a target="_blank" href="https://www.tchap.gouv.fr/#/room/!PHwHATDnuimhMowBKN:agent.dev-durable.tchap.gouv.fr">salon Tchap #Bnum-infos</a></p>
            </div>
        </li>
        <li role="button" aria-pressed="false">
            <span>Vous consultez votre messagerie sur un autre outil que le Bnum. Le Bnum ne vous sert qu'à accéder à des espaces de travail avec d'autres utilisateurs.</span>
            <div class="content">
                <p>Saisissez votre adresse e-mail pour recevoir un message de réinitialisation de votre mot de passe Bnum</p>
                <div class="form">
                    <form action="." method="post">
                        <div class="form-group">
                            <div class="controls">
                                <input type="email" name="_email" id="email" value="<?= $user->email; ?>" class="floatLabel" required>
                                <label for="email">E-mail</label>
                            </div>
                            <div class="controls">
                                <button type="submit button">Envoyer</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </li>
        <li role="button" aria-pressed="false">
            <span>Vous n'utilisez pas le Bnum, mais vous avez une boite Mél sans BALI, et vous souhaitez changer le mot de passe de ce compte.</span>
            <div class="content">
                <a href="../../changepassword" title="Changement de mot de passe pour les comptes Mél sans BALI">Ouvrir la page de changement de mot de passe pour les comptes Mél sans BALI</a>
            </div>
        </li>
    </ul>
</div>

<script src="https://code.jquery.com/jquery-2.2.4.min.js" type="text/javascript"></script>
<script src="js/main.js" type="text/javascript"></script>