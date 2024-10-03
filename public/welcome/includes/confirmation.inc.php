<h3>Étape 2 : Connexion au Bnum</h3>
<div>
    <div class="message">
        <p>Votre compte est correctement initialisé.</p>
        <p>Vous pouvez dés à présent vous connecter au Bnum, en utilisant votre adresse e-mail comme nom d'utilisateur et le mot de passe choisi.</p>
        <p>Vous pourrez ensuite accéder à l'espace de travail auquel vous venez d'être invité.</p>
    </div>
    <br>
    <form name="form" method="post" action="../../?_task=login" class="table-responsive-sm">
        <input type="hidden" name="_task" value="login">
        <input type="hidden" name="_action" value="login">
        <input type="hidden" name="_timezone" id="rcmlogintz" value="Europe/Paris">
        <table id="formlogintable" class="table">
            <tbody>
                <tr class="">
                    <td class="title">
                        <label for="rcmloginuser">Nom d’utilisateur</label>
                    </td>
                    <td class="input">
                        <input name="_user" id="rcmloginuser" size="40" autocapitalize="none" autocomplete="on" class="form-control input-mel login-type" value="" type="text">
                    </td>
                </tr>
                <tr>
                    <td class="title">
                        <label for="rcmloginpwd">Mot de passe</label>
                    </td>
                    <td class="input">
                        <input name="_pass" id="rcmloginpwd" size="40" autocapitalize="none" autocomplete="off" class="form-control input-mel login-type" type="password">
                    </td>
                </tr>
            </tbody>
        </table>
        <p class="formbuttons">
            <button id="rcmloginsubmit" class="button mainaction btn btn-primary btn-lg text-uppercase w-100" type="submit" value="Se connecter">Se connecter</button>
        </p>
    </form>
</div>
