import clsx from "clsx";
import Head from "next/head";
import mobileStyles from "../styles/resultpageStyles/iPhone14.module.css";
import MenuButton from '@/components/Button/Button';


export default function Home() {
  return (
    <>
      <Head>
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1.0, user-scalable=no" 
        />
        <title>WOW</title>
      </Head>
      <div className= {clsx(mobileStyles.backgroundSpace)}>
        <div className= {clsx(mobileStyles.whiteStars)}></div>  
        <div className= {clsx(mobileStyles.planet,mobileStyles.Earth)}></div> 
        <div className= {clsx(mobileStyles.Sun)}></div> 
        <div className= {clsx(mobileStyles.planet,mobileStyles.Jupiter)}></div> 
        <div className= {clsx(mobileStyles.planet,mobileStyles.Mars)}></div> 
      </div>
          <div className= {clsx(mobileStyles.backgroundShip)}>
            <div className={clsx( mobileStyles.index)}>
            
              <main className={clsx( mobileStyles.main)}>
                <div className={clsx(mobileStyles.imageWrapper)}>
                    <img
                        src="/images/小さい星1.png"
                        alt="小さい星1"
                        className={clsx(mobileStyles.littlestar)}
                    />
                    <img
                        src="/images/小さい星2.png"
                        alt="小さい星2"
                        className={clsx(mobileStyles.littlestar)}
                    />
                    <img
                        src="/images/小さい星3.png"
                        alt="小さい星3"
                        className={clsx(mobileStyles.littlestar)}
                    />
                  <img
                    src="/images/流れ星.png"
                    alt="流れ星"
                    className={clsx(mobileStyles.shootingstar)}
                  />
                </div>

                <div className={clsx(mobileStyles.button)}>
                    <MenuButton buttontype="menu">
                        ホームに戻る
                    </MenuButton>
                </div>
            
                
                
              </main>
        </div>
      </div>
    </>
  );
}