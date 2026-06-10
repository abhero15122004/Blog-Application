// src/hooks/use-toast.js
import { useState, useEffect } from 'react';

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

let count = 0;
function genId() {
    count = (count + 1) % Number.MAX_SAFE_INTEGER;
    return count.toString();
}

const ADD = 'ADD_TOAST';
const UPDATE = 'UPDATE_TOAST';
const DISMISS = 'DISMISS_TOAST';
const REMOVE = 'REMOVE_TOAST';

const toastTimeouts = new Map();
const listeners = [];
let memoryState = { toasts: [] };

function addToRemoveQueue(id) {
    if (toastTimeouts.has(id)) return;
    const t = setTimeout(() => {
        toastTimeouts.delete(id);
        dispatch({ type: REMOVE, toastId: id });
    }, TOAST_REMOVE_DELAY);
    toastTimeouts.set(id, t);
}

function reducer(state, action) {
    switch (action.type) {
        case ADD:
            return { ...state, toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) };
        case UPDATE:
            return {
                ...state,
                toasts: state.toasts.map((t) => t.id === action.toast.id ? { ...t, ...action.toast } : t),
            };
        case DISMISS: {
            const { toastId } = action;
            if (toastId) addToRemoveQueue(toastId);
            else state.toasts.forEach((t) => addToRemoveQueue(t.id));
            return {
                ...state,
                toasts: state.toasts.map((t) =>
                    toastId == null || t.id === toastId
                        ? { ...t, open: false }
                        : t
                ),
            };
        }
        case REMOVE:
            if (action.toastId == null) return { ...state, toasts: [] };
            return { ...state, toasts: state.toasts.filter((t) => t.id !== action.toastId) };
        default:
            return state;
    }
}

function dispatch(action) {
    memoryState = reducer(memoryState, action);
    listeners.forEach((l) => l(memoryState));
}

export function toast(props) {
    const id = genId();
    dispatch({
        type: ADD,
        toast: {
            ...props,
            id,
            open: true,
            onOpenChange: (open) => !open && dispatch({ type: DISMISS, toastId: id }),
        },
    });
    return {
        id,
        dismiss: () => dispatch({ type: DISMISS, toastId: id }),
        update: (upd) => dispatch({ type: UPDATE, toast: { ...upd, id } }),
    };
}

export function useToast() {
    const [state, setState] = useState(memoryState);
    useEffect(() => {
        listeners.push(setState);
        return () => {
            const idx = listeners.indexOf(setState);
            if (idx > -1) listeners.splice(idx, 1);
        };
    }, []);
    return {
        ...state,
        toast,
        dismiss: (toastId) => dispatch({ type: DISMISS, toastId }),
    };
}
