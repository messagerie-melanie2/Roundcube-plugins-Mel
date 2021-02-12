-- improve cache synchronization (#3933)
ALTER TABLE "kolab_folders"
  ADD "changed" timestamp DEFAULT NULL,
  ADD "objectcount" number DEFAULT NULL;
