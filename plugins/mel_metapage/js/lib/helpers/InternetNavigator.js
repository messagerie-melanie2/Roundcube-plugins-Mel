export class InternetNavigator {
  static IsFirefox() {
    return typeof InstallTrigger !== 'undefined';
  }
}
