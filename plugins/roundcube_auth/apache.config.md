
```
        <Directory /var/www/roundcube/>

                # Autres éléments de configuration
                # [...]

                # Configuration pour Kerberos
                <If "%{QUERY_STRING} =~ /^kerb=1/">
                        AuthType Kerberos
                        AuthName "Kerberos Login - NAME"
                        Krb5Keytab /path/to/file.keytab
                        KrbAuthRealms REALM.NAME.FIRST REALM.NAME.SECOND
                        KrbMethodNegotiate on
                        KrbSaveCredentials off
                        KrbServiceName Any
                        KrbMethodK5Passwd off
                        KrbLocalUserMapping on
                        Require valid-user
                        ErrorDocument 401 /%{REQUEST_URI}?kerb=0
                </If>
```