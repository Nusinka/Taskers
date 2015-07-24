var statesMap = {
    'new': [
        {to: 'doing', role: 'a'},
        {to: 'canceled', role: 'c'}
    ],
    'doing': [
        {to: 'ready', role: 'a'}
    ],
    'ready': [
        {to: 'done', role: 'c'},
        {to: 'failed', role: 'c'}
    ],
    'failed': [
        {to: 'doing', role: 'a'}
    ],
    'canceled': [
        {to: 'new', role: 'c'}
    ]
};

function FSM(current) {
    this.states = statesMap;
    this.current = current;
}

FSM.prototype = {
    constructor: FSM,
    can: function (state, role) {
        return !!this.states[this.current].filter(function (next) {
            return next.to == state && next.role == role;
        }).length;
    }
};
FSM.statesMap = statesMap;


module.exports = FSM;