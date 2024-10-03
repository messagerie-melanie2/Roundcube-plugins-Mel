export { Tuple, Tuple3, TupleX };

class BaseTuple {
  constructor(...args) {
    for (let index = 0, len = args.length; index < len; ++index) {
      const element = args[index];
      this[this._set_prop_name(index, element)] = this._set_element(
        element,
        index,
      );
    }
  }

  _set_prop_name(index, element) {
    return `item${index + 1}`;
  }

  _set_element(element, index) {
    return element;
  }
}

class BaseNamedTuple extends BaseTuple {
  constructor(...args) {
    super(...args);
  }

  _set_prop_name(index, element) {
    return element?.tname || super._set_prop_name(index, element);
  }

  _set_element(element, index) {
    const has = !!(element?.tname || false);
    return has ? element.item : super._set_element(element, index);
  }
}

/**
 * @class
 * @classdesc Tuple class
 * @template {T1, T2}
 */
class Tuple extends BaseNamedTuple {
  /**
   *
   * @param {T1} item1
   * @param {T2} item2
   */
  constructor(item1, item2) {
    super(item1, item2);
  }

  static named_item(name, item) {
    return {
      tname: name,
      item,
    };
  }
}

class Tuple3 extends Tuple {
  constructor(item1, item2, item3) {
    super(item1, item2, item3);
  }
}

class TupleX extends BaseNamedTuple {
  constructor(...args) {
    super(...args);
  }

  static named_item(name, item) {
    return Tuple.named_item(name, item);
  }
}
