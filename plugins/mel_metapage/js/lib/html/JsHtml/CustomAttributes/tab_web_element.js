import {
  HTMLTabContainer,
  HTMLTabReceiver,
} from './tabs/HTMLTabContainerAndReceiver.js';
import { HTMLTabsElement } from './tabs/HTMLTabElement.js';

export { HTMLTabContainer, HTMLTabReceiver, HTMLTabsElement, TabsElement };

/**
 * @type {typeof HTMLTabsElement}
 * @deprecated Utilisez HTMLTabsElement
 */
const TabsElement = HTMLTabsElement;
