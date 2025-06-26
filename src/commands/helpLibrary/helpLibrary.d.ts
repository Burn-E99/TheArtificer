interface HelpItem {
  name: string;
  description: string;
}

export type HelpDict = Map<string, HelpContents | HelpPage>;

export interface HelpContents extends HelpItem {
  isPage?: false;
  example?: string[];
}

export interface HelpPage extends HelpItem {
  isPage: true;
  dict: HelpDict;
}
