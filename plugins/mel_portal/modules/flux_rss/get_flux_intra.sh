#!/bin/sh
## Intranet
sudo wget http://intra.ac.e2.rie.gouv.fr/spip.php?page=backend-actu -O rss/intranet-mtes-ac.xml
sudo wget http://intra.snum.sg.e2.rie.gouv.fr/spip.php?page=backend-actu -O rss/intranet-mtes-snum.xml
sudo wget http://intra.dgitm.i2/spip.php?page=backend-actu -O rss/intranet-dgitm.xml
sudo wget http://intra.portail.e2.rie.gouv.fr/spip.php?page=backend-actu -O rss/intranet-mtes.xml
##extranet