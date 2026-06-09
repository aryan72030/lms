import { useNotification } from '@/contexts/notification-context';

export type ActionMessageType =
    | 'create'
    | 'update'
    | 'delete'
    | 'toggle'
    | 'submit'
    | 'approve'
    | 'reject'
    | 'archive'
    | 'republish'
    | 'move'
    | 'save'
    | 'cancel'
    | 'test'
    | 'grade'
    | 'reopen';

const actionLabels: Record<ActionMessageType, string> = {
    create: 'create',
    update: 'update',
    delete: 'delete',
    toggle: 'update',
    submit: 'submit',
    approve: 'approve',
    reject: 'reject',
    archive: 'archive',
    republish: 'republish',
    move: 'update',
    save: 'save',
    cancel: 'cancel',
    test: 'complete',
    grade: 'grade',
    reopen: 'reopen',
};

export function useActionMessages(defaultSubject = 'Item') {
    const { showSuccess, showError, showInfo } = useNotification();

    const success = (
        action: ActionMessageType,
        customMessage?: string,
        subject = defaultSubject
    ) => {
        if (customMessage) {
            showSuccess(customMessage);
        } else {
            const message = `${subject} ${actionLabels[action]}d successfully.`;
            showSuccess(message);
        }
    };

    const error = (
        action: ActionMessageType,
        customMessage?: string,
        subject = defaultSubject
    ) => {
        if (customMessage) {
            showError(customMessage);
        } else {
            const message = `Failed to ${actionLabels[action]} ${subject.toLowerCase()}. Please try again.`;
            showError(message);
        }
    };

    const info = (message: string, title?: string) => {
        showInfo(message, title);
    };

    return { success, error, info };
}
