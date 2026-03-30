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
    | 'test';

const successLabels: Record<ActionMessageType, string> = {
    create: 'created',
    update: 'updated',
    delete: 'deleted',
    toggle: 'updated',
    submit: 'submitted',
    approve: 'approved',
    reject: 'rejected',
    archive: 'archived',
    republish: 'republished',
    move: 'updated',
    save: 'saved',
    cancel: 'cancelled',
    test: 'completed',
};

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
};

export function useActionMessages(defaultSubject = 'Item') {
    const { showSuccess, showError, showInfo } = useNotification();

    const success = (action: ActionMessageType, subject = defaultSubject, message?: string) => {
        showSuccess(message ?? `${subject} ${successLabels[action]} successfully.`);
    };

    const error = (action: ActionMessageType, subject = defaultSubject, message?: string) => {
        showError(message ?? `Failed to ${actionLabels[action]} ${subject.toLowerCase()}. Please try again.`);
    };

    const info = (message: string, title?: string) => {
        showInfo(message, title);
    };

    return { success, error, info };
}
