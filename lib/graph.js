"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var EMPTY_MAP = {};
function getNodes(node) {
    var states = node.states;
    var nodes = Object.keys(states).reduce(function (accNodes, stateKey) {
        var subState = states[stateKey];
        var subNodes = getNodes(states[stateKey]);
        accNodes.push.apply(accNodes, [subState].concat(subNodes));
        return accNodes;
    }, []);
    return nodes;
}
exports.getNodes = getNodes;
function getEventEdges(node, event) {
    var transitions = node.on[event];
    return utils_1.flatMap(transitions.map(function (transition) {
        var targets = [].concat(transition.target);
        return targets.map(function (target) {
            var targetNode = node.getRelativeStateNodes(target, undefined, false)[0];
            return {
                source: node,
                target: targetNode,
                event: event,
                actions: transition.actions
                    ? transition.actions.map(utils_1.getActionType)
                    : [],
                cond: transition.cond
            };
        });
    }));
}
exports.getEventEdges = getEventEdges;
function getEdges(node, options) {
    var _a = (options || {}).deep, deep = _a === void 0 ? true : _a;
    var edges = [];
    if (node.states && deep) {
        Object.keys(node.states).forEach(function (stateKey) {
            edges.push.apply(edges, getEdges(node.states[stateKey]));
        });
    }
    Object.keys(node.on).forEach(function (event) {
        edges.push.apply(edges, getEventEdges(node, event));
    });
    return edges;
}
exports.getEdges = getEdges;
function getAdjacencyMap(node, extendedState) {
    var adjacency = {};
    var events = node.events;
    function findAdjacencies(stateValue) {
        var stateKey = JSON.stringify(stateValue);
        if (adjacency[stateKey]) {
            return;
        }
        adjacency[stateKey] = {};
        for (var _i = 0, events_1 = events; _i < events_1.length; _i++) {
            var event_1 = events_1[_i];
            var nextState = node.transition(stateValue, event_1, extendedState);
            adjacency[stateKey][event_1] = { state: nextState.value };
            findAdjacencies(nextState.value);
        }
    }
    findAdjacencies(node.initialState.value);
    return adjacency;
}
exports.getAdjacencyMap = getAdjacencyMap;
function getShortestPaths(machine, extendedState) {
    var _a;
    if (!machine.states) {
        return EMPTY_MAP;
    }
    var adjacency = getAdjacencyMap(machine, extendedState);
    var initialStateId = JSON.stringify(machine.initialState.value);
    var pathMap = (_a = {},
        _a[initialStateId] = [],
        _a);
    var visited = new Set();
    function util(stateValue) {
        var stateId = JSON.stringify(stateValue);
        visited.add(stateId);
        var eventMap = adjacency[stateId];
        for (var _i = 0, _a = Object.keys(eventMap); _i < _a.length; _i++) {
            var event_2 = _a[_i];
            var nextStateValue = eventMap[event_2].state;
            if (!nextStateValue) {
                continue;
            }
            var nextStateId = JSON.stringify(utils_1.toStateValue(nextStateValue, machine.delimiter));
            if (!pathMap[nextStateId] ||
                pathMap[nextStateId].length > pathMap[stateId].length + 1) {
                pathMap[nextStateId] = (pathMap[stateId] || []).concat([
                    { state: stateValue, event: event_2 }
                ]);
            }
        }
        for (var _b = 0, _c = Object.keys(eventMap); _b < _c.length; _b++) {
            var event_3 = _c[_b];
            var nextStateValue = eventMap[event_3].state;
            if (!nextStateValue) {
                continue;
            }
            var nextStateId = JSON.stringify(nextStateValue);
            if (visited.has(nextStateId)) {
                continue;
            }
            util(nextStateValue);
        }
        return pathMap;
    }
    util(machine.initialState.value);
    return pathMap;
}
exports.getShortestPaths = getShortestPaths;
function getShortestPathsAsArray(machine, extendedState) {
    var result = getShortestPaths(machine, extendedState);
    return Object.keys(result).map(function (key) { return ({
        state: JSON.parse(key),
        path: result[key]
    }); });
}
exports.getShortestPathsAsArray = getShortestPathsAsArray;
function getSimplePaths(machine, extendedState) {
    if (!machine.states) {
        return EMPTY_MAP;
    }
    var adjacency = getAdjacencyMap(machine, extendedState);
    var visited = new Set();
    var path = [];
    var paths = {};
    function util(fromPathId, toPathId) {
        visited.add(fromPathId);
        if (fromPathId === toPathId) {
            paths[toPathId] = paths[toPathId] || [];
            paths[toPathId].push(path.slice());
        }
        else {
            for (var _i = 0, _a = Object.keys(adjacency[fromPathId]); _i < _a.length; _i++) {
                var subEvent = _a[_i];
                var nextStateValue = adjacency[fromPathId][subEvent].state;
                if (!nextStateValue) {
                    continue;
                }
                var nextStateId = JSON.stringify(nextStateValue);
                if (!visited.has(nextStateId)) {
                    path.push({ state: JSON.parse(fromPathId), event: subEvent });
                    util(nextStateId, toPathId);
                }
            }
        }
        path.pop();
        visited.delete(fromPathId);
    }
    var initialStateId = JSON.stringify(machine.initialState.value);
    Object.keys(adjacency).forEach(function (nextStateId) {
        util(initialStateId, nextStateId);
    });
    return paths;
}
exports.getSimplePaths = getSimplePaths;
function getSimplePathsAsArray(machine, extendedState) {
    var result = getSimplePaths(machine, extendedState);
    return Object.keys(result).map(function (key) { return ({
        state: JSON.parse(key),
        paths: result[key]
    }); });
}
exports.getSimplePathsAsArray = getSimplePathsAsArray;