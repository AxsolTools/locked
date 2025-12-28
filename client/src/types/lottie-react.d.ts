declare module 'lottie-react' {
  import { CSSProperties, FC } from 'react';
  
  export interface LottieComponentProps {
    animationData: any;
    loop?: boolean;
    autoplay?: boolean;
    style?: CSSProperties;
    className?: string;
    width?: string | number;
    height?: string | number;
  }
  
  const Lottie: FC<LottieComponentProps>;
  
  export default Lottie;
} 