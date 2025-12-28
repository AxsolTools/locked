declare module 'react-helmet' {
  import { Component, ReactNode } from 'react';
  
  interface HelmetProps {
    title?: string;
    defaultTitle?: string;
    titleTemplate?: string;
    meta?: Array<{
      name?: string;
      property?: string;
      content?: string;
      httpEquiv?: string;
      charset?: string;
    }>;
    link?: Array<{
      rel?: string;
      href?: string;
      sizes?: string;
      type?: string;
      media?: string;
      crossorigin?: string;
      integrity?: string;
      as?: string;
    }>;
    script?: Array<{
      type?: string;
      src?: string;
      async?: boolean;
      defer?: boolean;
      integrity?: string;
      crossorigin?: string;
      innerHTML?: string;
    }>;
    noscript?: Array<{
      innerHTML?: string;
    }>;
    style?: Array<{
      type?: string;
      cssText?: string;
    }>;
    onChangeClientState?: (
      newState: any,
      addedTags: any,
      removedTags: any
    ) => void;
    base?: {
      target?: string;
      href?: string;
    };
    htmlAttributes?: Record<string, string | boolean>;
    bodyAttributes?: Record<string, string | boolean>;
    children?: ReactNode;
  }
  
  export class Helmet extends Component<HelmetProps> {
    static renderStatic(): {
      base: any;
      bodyAttributes: any;
      htmlAttributes: any;
      link: any;
      meta: any;
      noscript: any;
      script: any;
      style: any;
      title: any;
      titleAttributes: any;
    };
  }
  
  export default Helmet;
} 