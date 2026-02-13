import React from 'react';
import ReactDOM from 'react-dom/client';

// [중요 수정] 확장자를 반드시 .js로 명시해야 합니다. 
// (깃허브에서도 App.tsx 파일 이름을 App.js로 변경하셔야 합니다!)
import App from './App.js'; 

const rootElement = document.getElementById('root');

if (!rootElement) {
    console.error("Root element not found");
} else {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        React.createElement(React.StrictMode, null, 
            React.createElement(App)
        )
    );
}
}