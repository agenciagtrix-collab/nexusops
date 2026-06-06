import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export const SHORTCUTS = [
  { keys: ['g', 'h'], description: 'Ir para Dashboard', category: 'Navegação' },
  { keys: ['g', 'p'], description: 'Ir para Projetos', category: 'Navegação' },
  { keys: ['g', 't'], description: 'Ir para Minhas Tarefas', category: 'Navegação' },
  { keys: ['g', 'c'], description: 'Ir para Clientes', category: 'Navegação' },
  { keys: ['g', 'a'], description: 'Ir para Analytics', category: 'Navegação' },
  { keys: ['g', 's'], description: 'Ir para Configurações', category: 'Navegação' },
  { keys: ['/'], description: 'Abrir busca global', category: 'Geral' },
  { keys: ['?'], description: 'Mostrar atalhos', category: 'Geral' },
  { keys: ['Escape'], description: 'Fechar modal / cancelar', category: 'Geral' },
  { keys: ['n'], description: 'Nova tarefa (em projeto)', category: 'Ações' },
  { keys: ['e'], description: 'Editar item selecionado', category: 'Ações' },
  { keys: ['d'], description: 'Excluir item selecionado', category: 'Ações' },
];

export function useKeyboardShortcuts({ onSearch, onNewTask, onShowHelp } = {}) {
  const navigate = useNavigate();
  const bufferRef = useRef('');
  const bufferTimeoutRef = useRef(null);

  const handleKeyDown = useCallback((e) => {
    // Don't trigger when typing in inputs
    const target = e.target;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true' ||
      target.closest('[role="dialog"]')
    ) return;

    const key = e.key;

    // Single key shortcuts
    if (key === '/' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      onSearch?.();
      return;
    }
    if (key === '?' || (key === '/' && e.shiftKey)) {
      e.preventDefault();
      onShowHelp?.();
      return;
    }
    if (key === 'n' && !e.ctrlKey && !e.metaKey) {
      onNewTask?.();
      return;
    }

    // Cmd/Ctrl + K for search
    if ((e.ctrlKey || e.metaKey) && key === 'k') {
      e.preventDefault();
      onSearch?.();
      return;
    }

    // Two-key sequences (g + x)
    if (bufferRef.current === 'g') {
      clearTimeout(bufferTimeoutRef.current);
      bufferRef.current = '';
      switch (key) {
        case 'h': navigate('/'); break;
        case 'p': navigate('/projects'); break;
        case 't': navigate('/my-tasks'); break;
        case 'c': navigate('/clients'); break;
        case 'a': navigate('/analytics'); break;
        case 's': navigate('/settings'); break;
        default: break;
      }
      return;
    }

    if (key === 'g') {
      bufferRef.current = 'g';
      bufferTimeoutRef.current = setTimeout(() => {
        bufferRef.current = '';
      }, 1000);
    }
  }, [navigate, onSearch, onNewTask, onShowHelp]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(bufferTimeoutRef.current);
    };
  }, [handleKeyDown]);
}