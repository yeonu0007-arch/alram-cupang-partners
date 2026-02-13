import React from 'react';
import ReactDOM from 'react-dom/client';
// [수정] .tsx 확장자를 명시하거나, App 파일도 .js로 관리해야 합니다.
import App from './App.tsx'; 

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