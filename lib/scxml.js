"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var xml_js_1 = require("xml-js");
var utils_1 = require("./utils");
var actions = require("./actions");
function stateNodeToSCXML(stateNode) {
    var parallel = stateNode.parallel;
    var scxmlElement = {
        type: 'element',
        name: parallel ? 'parallel' : 'state',
        attributes: {
            id: stateNode.id
        },
        elements: [
            !parallel && stateNode.initial
                ? {
                    type: 'element',
                    name: 'initial',
                    elements: [
                        {
                            type: 'element',
                            name: 'transition',
                            attributes: {
                                target: stateNode.states[stateNode.initial].id
                            }
                        }
                    ]
                }
                : undefined,
            stateNode.onEntry && {
                type: 'element',
                name: 'onentry',
                elements: stateNode.onEntry.map(function (event) {
                    return {
                        type: 'element',
                        name: 'send',
                        attributes: {
                            event: utils_1.getActionType(event)
                        }
                    };
                })
            },
            stateNode.onExit && {
                type: 'element',
                name: 'onexit',
                elements: stateNode.onExit.map(function (event) {
                    return {
                        type: 'element',
                        name: 'send',
                        attributes: {
                            event: utils_1.getActionType(event)
                        }
                    };
                })
            }
        ].concat(Object.keys(stateNode.states).map(function (stateKey) {
            var subStateNode = stateNode.states[stateKey];
            return stateNodeToSCXML(subStateNode);
        }), Object.keys(stateNode.on)
            .map(function (event) {
            var transition = stateNode.on[event];
            if (!transition) {
                return [];
            }
            if (Array.isArray(transition)) {
                return transition.map(function (targetTransition) {
                    return {
                        type: 'element',
                        name: 'transition',
                        attributes: __assign({}, (event ? { event: event } : undefined), { target: stateNode.parent.getRelativeStateNodes(targetTransition.target)[0].id }, (targetTransition.cond
                            ? { cond: targetTransition.cond.toString() }
                            : undefined)),
                        elements: targetTransition.actions
                            ? targetTransition.actions.map(function (action) { return ({
                                type: 'element',
                                name: 'send',
                                attributes: {
                                    event: utils_1.getActionType(action)
                                }
                            }); })
                            : undefined
                    };
                });
            }
            return Object.keys(transition).map(function (target) {
                var targetTransition = transition[target];
                return {
                    type: 'element',
                    name: 'transition',
                    attributes: __assign({}, (event ? { event: event } : undefined), { target: stateNode.parent.getRelativeStateNodes(target)[0]
                            .id }, (targetTransition.cond
                        ? { cond: targetTransition.cond.toString() }
                        : undefined)),
                    elements: targetTransition.actions
                        ? targetTransition.actions.map(function (action) { return ({
                            type: 'element',
                            name: 'send',
                            attributes: {
                                event: utils_1.getActionType(action)
                            }
                        }); })
                        : undefined
                };
            });
        })
            .reduce(function (a, b) { return a.concat(b); })).filter(Boolean)
    };
    return scxmlElement;
}
function fromMachine(machine) {
    var scxmlDocument = {
        declaration: { attributes: { version: '1.0', encoding: 'utf-8' } },
        elements: [
            { type: 'instruction', name: 'access-control', instruction: 'allow="*"' },
            {
                type: 'element',
                name: 'scxml',
                attributes: {
                    version: '1.0',
                    initial: machine.id
                }
            },
            stateNodeToSCXML(machine)
        ]
    };
    return xml_js_1.js2xml(scxmlDocument, { spaces: 2 });
}
exports.fromMachine = fromMachine;
function indexedRecord(items, identifier) {
    var record = {};
    var identifierFn = typeof identifier === 'string' ? function (item) { return item[identifier]; } : identifier;
    items.forEach(function (item) {
        var key = identifierFn(item);
        record[key] = item;
    });
    return record;
}
function indexedAggregateRecord(items, identifier) {
    var record = {};
    var identifierFn = typeof identifier === 'string' ? function (item) { return item[identifier]; } : identifier;
    items.forEach(function (item) {
        var key = identifierFn(item);
        (record[key] = record[key] || []).push(item);
    });
    return record;
}
function executableContent(elements) {
    var transition = {
        actions: []
    };
    elements.forEach(function (element) {
        switch (element.name) {
            case 'raise':
                transition.actions.push(actions.raise(element.attributes.event));
            default:
                return;
        }
    });
    return transition;
}
function toConfig(nodeJson, id, options) {
    var evalCond = options.evalCond;
    var parallel = nodeJson.name === 'parallel';
    var initial = parallel ? undefined : nodeJson.attributes.initial;
    var states;
    var on;
    var elements = nodeJson.elements;
    switch (nodeJson.name) {
        case 'history': {
            if (!elements) {
                return {
                    id: id,
                    history: nodeJson.attributes.type || 'shallow'
                };
            }
            var transitionElement = elements.filter(function (element) { return element.name === 'transition'; })[0];
            return {
                id: id,
                history: nodeJson.attributes.type || 'shallow',
                target: "#" + transitionElement.attributes.target
            };
        }
        default:
            break;
    }
    if (nodeJson.elements) {
        var stateElements = nodeJson.elements.filter(function (element) {
            return element.name === 'state' ||
                element.name === 'parallel' ||
                element.name === 'history';
        });
        var transitionElements = nodeJson.elements.filter(function (element) { return element.name === 'transition'; });
        var onEntryElement = nodeJson.elements.find(function (element) { return element.name === 'onentry'; });
        var onExitElement = nodeJson.elements.find(function (element) { return element.name === 'onexit'; });
        var initialElement = !initial
            ? nodeJson.elements.find(function (element) { return element.name === 'initial'; })
            : undefined;
        if (initialElement && initialElement.elements.length) {
            initial = initialElement.elements.find(function (element) { return element.name === 'transition'; }).attributes.target;
        }
        states = indexedRecord(stateElements, function (item) { return "" + item.attributes.id; });
        on = utils_1.mapValues(indexedAggregateRecord(transitionElements, function (item) { return item.attributes.event || ''; }), function (values) {
            return values.map(function (value) { return (__assign({ target: "#" + value.attributes.target }, (value.elements ? executableContent(value.elements) : undefined), (value.attributes.cond
                ? {
                    cond: evalCond(value.attributes.cond)
                }
                : undefined))); });
        });
        var onEntry = onEntryElement
            ? onEntryElement.elements.map(function (element) {
                switch (element.name) {
                    case 'raise':
                        return actions.raise(element.attributes.event);
                    default:
                        return 'not-implemented';
                }
            })
            : undefined;
        var onExit = onExitElement
            ? onExitElement.elements.map(function (element) {
                switch (element.name) {
                    case 'raise':
                        return actions.raise(element.attributes.event);
                    default:
                        return 'not-implemented';
                }
            })
            : undefined;
        return __assign({ id: id, delimiter: options.delimiter }, (initial ? { initial: initial } : undefined), (parallel ? { parallel: parallel } : undefined), (stateElements.length
            ? {
                states: utils_1.mapValues(states, function (state, key) {
                    return toConfig(state, key, options);
                })
            }
            : undefined), (transitionElements.length ? { on: on } : undefined), (onEntry ? { onEntry: onEntry } : undefined), (onExit ? { onExit: onExit } : undefined));
    }
    return { id: id };
}
function toMachine(xml, options) {
    var json = xml_js_1.xml2js(xml);
    var machineElement = json.elements.filter(function (element) { return element.name === 'scxml'; })[0];
    return toConfig(machineElement, '(machine)', options);
}
exports.toMachine = toMachine;