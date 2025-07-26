/*npm install clsxが必要 */

import Image from "next/image";
import Head from "next/head";
import clsx from "clsx";

import baseStyles from "../styles/toppageStyles/index.module.css";
import mobileStyles from "../styles/toppageStyles/iPhone14.module.css";


export default function Home() {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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
            <div className={clsx(baseStyles.index, mobileStyles.index)}>
            
              <main className={clsx(baseStyles.main, mobileStyles.main)}>
                
                <div className={clsx(baseStyles.imageWrapper, mobileStyles.imageWrapper)}>
                  <img
                    src="/images/宇宙人ピンク.gif"
                    alt="宇宙のキャラクター"
                    className={clsx(baseStyles.character, mobileStyles.character)}
                  />
                </div>
                
              </main>
            </div>
          </div>
        
      
    </>
  );
}