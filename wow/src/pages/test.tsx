import React from "react";
import Button from '../components/Button/Button';


const TestPage: React.FC = () => {
    return(
        <div>
            <h1>テストページ</h1>
            <Button
            children
            buttontype="quest"/>

        </div>
    );
};

export default TestPage;