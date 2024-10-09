<h3>Étape 1 : Initialisation de votre compte</h3>
<div>
    <div class="message">
        <p>Durant cette étape vous devez définir votre nom, prénom et mot de passe. Vous pourrez ensuite vous connecter au Bnum pour rejoindre l'espace de travail pour lequel vous avez été invité.</p>
    </div>
    <div class="form">
        <form action="." method="post">

            <div class="form-group">
                <div class="controls">
                    <input type="email" name="_email" id="email" value="<?= $user->email; ?>" readonly>
                    <input type="hidden" name="_h" id="hash" value="<?= $hash; ?>">
                    <label for="email" class="active">E-mail</label>
                </div>
                <div class="controls">
                    <input type="text" name="_firstname" id="firstname" class="floatLabel" value="<?= $user->firstname; ?>" required>
                    <label for="firstname" class="<?= empty($user->firstname) ?: 'active'; ?>">Prénom</label>
                </div>
                <div class="controls">
                    <input type="text" name="_lastname" id="lastname" class="floatLabel" value="<?= $user->lastname; ?>" required>
                    <label for="lastname" class="<?= empty($user->lastname) ?: 'active'; ?>">Nom</label>
                </div>
                <div class="controls">
                    <input type="password" name="_password" id="password" class="floatLabel" required>
                    <label for="password">Mot de passe</label>
                    <div class="password_hint">
                        Le mot de passe doit avoir une longueur d'au moins 10 caractères, avec au moins un caractère de chaque type : majuscule, minuscule, chiffre, caractère spécial (!"#$%&'()*+,-./:<=>?@[^]_{|}~). Les accents (â à â é è ê …) ne sont pas autorisés. 
                    </div>
                </div>
                <?php if (!empty($message)) { ?>
                    <div class="message error">
                        <p><?= $message; ?></p>
                    </div>
                <?php } ?>
                <div class="controls">
                    <button type="submit button">Suivant</button>
                </div>
            </div>
        </form>
    </div>
</div>

<script src="https://code.jquery.com/jquery-2.2.4.min.js" type="text/javascript"></script>
<script src="js/main.js" type="text/javascript"></script>