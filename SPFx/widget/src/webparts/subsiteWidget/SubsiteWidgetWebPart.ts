import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneSlider,
  PropertyPaneToggle,
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import SubsiteWidget from './components/SubsiteWidget';
import { ISubsiteWidgetProps } from './components/ISubsiteWidgetProps';

export interface ISubsiteWidgetWebPartProps {
  maxItems: number;
  showSearch: boolean;
}

export default class SubsiteWidgetWebPart extends BaseClientSideWebPart<ISubsiteWidgetWebPartProps> {

  public render(): void {
    const element: React.ReactElement<ISubsiteWidgetProps> = React.createElement(
      SubsiteWidget,
      {
        spHttpClient: this.context.spHttpClient,
        webAbsoluteUrl: this.context.pageContext.web.absoluteUrl,
        maxItems: this.properties.maxItems || 0,
        showSearch: this.properties.showSearch !== false,
      }
    );
    ReactDom.render(element, this.domElement);
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) return;
    const { semanticColors } = currentTheme;
    if (semanticColors) {
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
      this.domElement.style.setProperty('--link', semanticColors.link || null);
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
    }
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: 'Impostazioni widget' },
          groups: [
            {
              groupName: 'Visualizzazione',
              groupFields: [
                PropertyPaneToggle('showSearch', {
                  label: 'Mostra barra di ricerca',
                  onText: 'Sì',
                  offText: 'No',
                }),
                PropertyPaneSlider('maxItems', {
                  label: 'Numero massimo di sottositi (0 = tutti)',
                  min: 0,
                  max: 200,
                  step: 5,
                  showValue: true,
                }),
              ]
            }
          ]
        }
      ]
    };
  }
}
