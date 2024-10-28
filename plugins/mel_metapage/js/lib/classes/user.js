export { MelUser, current_user as MelCurrentUser };
import { MelObject } from '../mel_object.js';

class MelUser {
  constructor(name, lastname, fullname = null) {
    this._init()._setup(name, lastname, fullname);
  }

  _init() {
    this.name = EMPTY_STRING;
    this.last_name = EMPTY_STRING;
    this.fullname = EMPTY_STRING;

    return this;
  }

  _setup(...args) {
    const [name, lastname, fullname] = args;
    this.name = name;
    this.last_name = lastname;

    Object.defineProperties(this, {
      fullname: {
        get: function () {
          return fullname ?? `${this.name} ${this.last_name}`;
        },
        configurable: true,
      },
    });

    return this;
  }
}

class AMelObjectUser extends MelObject {
  constructor() {
    super();
  }

  main() {
    super.main();

    this.name = EMPTY_STRING;
    this.last_name = EMPTY_STRING;
    this.fullname = EMPTY_STRING;
  }
}

class MelCurrentUser extends AMelObjectUser {
  constructor() {
    super();
  }

  main() {
    super.main();

    const self = this;
    Object.defineProperties(this, {
      name: {
        get: function () {
          return self._get_name();
        },
        configurable: true,
      },
      lastname: {
        get: function () {
          return self._get_last_name();
        },
        configurable: true,
      },
      fullname: {
        get: function () {
          return self._get_full_name();
        },
        configurable: true,
      },
      emails: {
        get: function () {
          return self.get_env('mel_metapage_user_emails');
        },
        configurable: true,
      },
      main_email: {
        get: function () {
          return self.emails?.[0];
        },
        configurable: true,
      },
    });
  }

  _get_name() {
    const KEY = 'user_name';
    let user_name = this.load(KEY);

    if (!user_name) {
      user_name = this.rcmail().env.current_user?.name;

      if (user_name) this.save(KEY, user_name);
    }

    return user_name;
  }

  _get_last_name() {
    const KEY = 'user_last_name';
    let user_name = this.load(KEY);

    if (!user_name) {
      user_name = this.rcmail().env.current_user?.lastname;

      if (user_name) this.save(KEY, user_name);
    }

    return user_name;
  }

  _get_full_name() {
    const KEY = 'user_full_name';
    let user_name = this.load(KEY);

    if (!user_name) {
      user_name = this.rcmail().env.current_user?.full;

      if (user_name) this.save(KEY, user_name);
    }

    return user_name;
  }

  get_name_from_fullname() {
    const fullname = this.fullname;
    let name = null;

    if (fullname) {
      name = fullname.split(' - ');
      name = name[0].split(' ')[1];
    }

    return name;
  }
}

const current_user = new MelCurrentUser();
