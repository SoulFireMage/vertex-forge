import { render } from 'preact';
import './styles.css';
import { App } from './app';
import { initAccount } from './state/store';

render(<App />, document.getElementById('app')!);

// Optional sync loads in the background; the app is fully usable without it.
void initAccount();
