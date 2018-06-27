import { Event, StateValue, Action, StandardMachine, ParallelMachine, SimpleOrCompoundStateNodeConfig, ParallelMachineConfig, EventType, StandardMachineConfig, Activity, ConditionalTransitionConfig, StateTransition, MachineOptions, HistoryValue } from './types';
import { State } from './State';
declare class StateNode {
    config: SimpleOrCompoundStateNodeConfig | StandardMachineConfig | ParallelMachineConfig;
    options: MachineOptions;
    key: string;
    id: string;
    path: string[];
    initial?: string;
    parallel?: boolean;
    transient: boolean;
    states: Record<string, StateNode>;
    history: false | 'shallow' | 'deep';
    on: Record<string, ConditionalTransitionConfig>;
    onEntry: Action[];
    onExit: Action[];
    activities?: Activity[];
    strict: boolean;
    parent?: StateNode;
    machine: StateNode;
    data: object | undefined;
    delimiter: string;
    private __cache;
    private idMap;
    constructor(config: SimpleOrCompoundStateNodeConfig | StandardMachineConfig | ParallelMachineConfig, options?: MachineOptions);
    getStateNodes(state: StateValue | State): StateNode[];
    handles(event: Event): boolean;
    private _transitionLeafNode;
    private _transitionHierarchicalNode;
    private _transitionOrthogonalNode;
    _transition(stateValue: StateValue, state: State, event: Event, extendedState?: any): StateTransition;
    private _next;
    private _getEntryExitStates;
    private _evaluateCond;
    private _getActions;
    private _getActivities;
    transition(state: StateValue | State, event: Event, extendedState?: any): State;
    private ensureValidPaths;
    getStateNode(stateKey: string): StateNode;
    getStateNodeById(stateId: string): StateNode;
    private resolve;
    private readonly resolvedStateValue;
    private getResolvedPath;
    private readonly initialStateValue;
    readonly initialState: State;
    readonly target: StateValue | undefined;
    getStates(stateValue: StateValue): StateNode[];
    /**
     * Returns the leaf nodes from a state path relative to this state node.
     *
     * @param relativeStateId The relative state path to retrieve the state nodes
     * @param history The previous state to retrieve history
     * @param resolve Whether state nodes should resolve to initial child state nodes
     */
    getRelativeStateNodes(relativeStateId: string | string[], historyValue?: HistoryValue, resolve?: boolean): StateNode[];
    readonly initialStateNodes: StateNode[];
    /**
     * Retrieves state nodes from a relative path to this state node.
     *
     * @param relativePath The relative path from this state node
     * @param historyValue
     */
    getFromRelativePath(relativePath: string[], historyValue?: HistoryValue): StateNode[];
    static updateHistoryValue(hist: HistoryValue, stateValue: StateValue): HistoryValue;
    historyValue(relativeStateValue?: StateValue | undefined): HistoryValue | undefined;
    /**
     * Resolves to the historical value(s) of the parent state node,
     * represented by state nodes.
     *
     * @param historyValue
     */
    private resolveHistory;
    readonly events: EventType[];
    private formatTransition;
    private formatTransitions;
}
export declare function Machine<T extends StandardMachineConfig | ParallelMachineConfig>(config: T, options?: MachineOptions): T extends ParallelMachineConfig ? ParallelMachine : T extends StandardMachineConfig ? StandardMachine : never;
export { StateNode };