import React, { useState, useEffect, useMemo } from 'react';
import type { Plan, PlanAction, Task, UpdateActionData, DeleteActionData } from '../types.ts';
import { TrashIcon } from './Icons.tsx';

interface ConfirmationModalProps {
  plan: Plan;
  tasks: Task[];
  onConfirm: (plan: Plan) => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ plan, tasks, onConfirm, onCancel }) => {
    const initialActions = useMemo(() => {
        const creations: PlanAction[] = (plan.creations || []).map(data => ({ type: 'CREATE', data }));
        const updates: PlanAction[] = (plan.updates || []).map(data => ({ type: 'UPDATE', data }));
        const deletions: PlanAction[] = (plan.deletions || []).map(data => ({ type: 'DELETE', data }));
        return [...creations, ...updates, ...deletions];
    }, [plan]);

    const [actions, setActions] = useState<PlanAction[]>(initialActions);

    useEffect(() => {
        setActions(initialActions);
    }, [initialActions]);
    
    const getActionTitle = (action: PlanAction): string => {
        switch (action.type) {
            case 'CREATE': return action.data.title;
            case 'UPDATE': {
                const task = tasks.find(t => t.id === (action.data as UpdateActionData).taskId);
                return (action.data as UpdateActionData).newTitle || task?.title || `Task ID: ${(action.data as UpdateActionData).taskId}`;
            }
            case 'DELETE': {
                 const task = tasks.find(t => t.id === (action.data as DeleteActionData).taskId);
                return task?.title || `Task ID: ${(action.data as DeleteActionData).taskId}`;
            }
        }
    };

    const getActionDetails = (action: PlanAction): string => {
        if (action.type === 'UPDATE') {
            const task = tasks.find(t => t.id === (action.data as UpdateActionData).taskId);
            const details = Object.entries(action.data)
                .filter(([key, value]) => value !== undefined && key !== 'taskId' && key !== 'newTitle')
                .map(([key, value]) => {
                    if (key === 'newTags') return `tags: ${(value as string[]).join(', ')}`;
                    return `${key.replace('new', '').toLowerCase()}: ${value}`
                })
                .join(', ');
            return `Updating "${task?.title || 'Unknown Task'}" -> ${details || 'No changes'}`;
        }
        if (action.type === 'CREATE') {
            const details = [
                action.data.dueDate,
                action.data.dueTime,
                action.data.status,
                action.data.tags?.join(', ')
            ].filter(Boolean).join(' - ');
            return details;
        }
        return '';
    };

    const handleRemoveAction = (indexToRemove: number) => {
        setActions(currentActions => currentActions.filter((_, index) => index !== indexToRemove));
    };

    const handleConfirm = () => {
        const finalPlan: Plan = { creations: [], updates: [], deletions: [] };
        actions.forEach(action => {
            if (action.type === 'CREATE') finalPlan.creations.push(action.data);
            else if (action.type === 'UPDATE') finalPlan.updates.push(action.data);
            else if (action.type === 'DELETE') finalPlan.deletions.push(action.data);
        });
        onConfirm(finalPlan);
    };

    const actionConfig = {
        CREATE: { color: 'border-green-500', label: 'CREATE' },
        UPDATE: { color: 'border-yellow-500', label: 'UPDATE' },
        DELETE: { color: 'border-red-500', label: 'DELETE' },
    };

    return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
      onClick={onCancel}
    >
        <div 
            className="bg-surface rounded-lg shadow-2xl p-6 w-full max-w-lg text-primary-text flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
        >
            <h2 className="text-2xl font-bold mb-2 text-primary-text flex-shrink-0">Confirm AI Actions</h2>
            <p className="text-sm text-secondary-text mb-4 flex-shrink-0">The AI assistant has proposed the following changes. Please review and confirm them below.</p>
            
            <div className="flex-grow overflow-y-auto pr-2 space-y-3">
                {actions.length > 0 ? actions.map((action, index) => (
                    <div key={index} className={`flex items-center justify-between bg-gray-50 p-3 rounded-lg border-l-4 ${actionConfig[action.type].color}`}>
                        <div>
                            <div className="flex items-center space-x-2">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-${actionConfig[action.type].color.split('-')[1]}-100 text-${actionConfig[action.type].color.split('-')[1]}-800`}>{actionConfig[action.type].label}</span>
                                <span className="font-medium text-primary-text">{getActionTitle(action)}</span>
                            </div>
                            {(action.type === 'UPDATE' || action.type === 'CREATE') && <p className="text-xs text-secondary-text mt-1 ml-2">{getActionDetails(action)}</p>}
                        </div>
                        <button onClick={() => handleRemoveAction(index)} className="p-1 text-secondary-text hover:text-red-500 transition-colors rounded-full hover:bg-red-500/10">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                )) : (
                    <div className="text-center py-8 text-secondary-text">
                        <p>No actions to confirm.</p>
                    </div>
                )}
            </div>

            <div className="flex justify-end space-x-3 mt-6 flex-shrink-0">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-primary-text transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={actions.length === 0}
                    className="px-4 py-2 rounded bg-accent-dark hover:bg-indigo-800 text-white transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Confirm
                </button>
            </div>
        </div>
    </div>
    );
};