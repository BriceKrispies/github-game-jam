import './styles/reset.css';
import './styles/tokens.css';
import './styles/shell.css';
import { createApp } from './shell/app';

const root = document.getElementById('app');

if (root) {
  createApp(root);
} else {
  console.error('[shell] Missing #app root element');
}
