import React from "react";
import Button from '../components/Button/Button';
import styles from '../styles/QuizPage.module.css';


const TestPage: React.FC = () => {
    return(
        <div className={styles.container} >
            <div className={styles.container2}>


            {/*上部大きいモニター */}
            <div className={styles.topSection}>
                問題
            </div>

            {/*中央4つの四角いモニター */}
            <div className={styles.buttonGrid}>
                <Button buttontype="quest">A</Button>
                <Button buttontype="quest">B</Button>
                <Button buttontype="quest">C</Button>
                <Button buttontype="quest">D</Button>

            </div>
            </div>
        </div>
    );
};

export default TestPage;