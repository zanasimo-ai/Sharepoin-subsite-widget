import { SPHttpClient } from '@microsoft/sp-http';

export interface ISubsiteWidgetProps {
  spHttpClient: SPHttpClient;
  webAbsoluteUrl: string;
  maxItems: number;
  showSearch: boolean;
}
