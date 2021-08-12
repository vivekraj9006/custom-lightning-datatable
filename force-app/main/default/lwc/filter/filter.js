import { LightningElement, api, track } from 'lwc';

export default class Filter extends LightningElement {

    @track filterCriteriaList = [];// Filter values 
    @api filedsList; // list fields with data-types 
    //eg. { label: "Account Name", fieldName: "Name", type: "string" }

    @track filterState = false; // toggle Button

    @track resourceValue;
    @track operatorValue;
    @track resourceName;
    @track operatorName;
    @track userInputSearchValue;
    @track valueType; // eg, text , date ,email,etc

    isOperatorDisabled = true;
    isValueDisabled = true;
    @track actionVal = 'AND';

    trackFielterId = 0;
    isDate = false;

    // operatorOptions
    operatorOption = []; // Actualy return by get method
    stringOption = [
        { label: 'equals', value: 'equals' },
        { label: 'not equals', value: 'notEquals' },
        { label: 'contains', value: 'contains' },
        { label: 'starts with', value: 'startsWith' },
        { label: 'ends with', value: 'endsWith' },
        { label: 'empty', value: 'empty' }
    ];

    doubleOption = [
        { label: 'equals', value: 'equals' },
        { label: 'not equals', value: 'notEquals' },
        { label: 'less than', value: 'lessThan' },
        { label: 'greater than', value: 'greaterThan' },
        { label: 'less or equal', value: 'lessOrEqual' },
        { label: 'greater or equal', value: 'greaterOrEqual' }
    ];

    dateOption = [
        { label: 'equals', value: 'equals' },
        { label: 'not equals', value: 'notEquals' },
        { label: 'less than', value: 'lessThan' },
        { label: 'greater than', value: 'greaterThan' },
        { label: 'less or equal', value: 'lessOrEqual' },
        { label: 'greater or equal', value: 'greaterOrEqual' }
    ];

    get resourceOptions() { //Resource == DataTable Column values
        return this.filedsList;
    }
    get takeActionOption() { // for and or combo
        return [
            { label: 'All AND', value: 'AND' },
            { label: 'All OR', value: 'OR' },
        ];
    }

    get operatorOptions() { //Operator eg, Starts With , end with , lessthan  etc
        switch (this.valueType) {
            case 'string':
            case 'url':
            case 'email':
            case 'picklist':
            case 'phone':
                this.operatorOption = this.stringOption;
                this.isDate = false;
                break;

            case 'currency':
            case 'double':
                this.operatorOption = this.doubleOption;
                this.isDate = false;
                break;

            case 'datetime':
                this.operatorOption = this.dateOption;
                this.isDate = true;
                break;
            case 'time':
                this.operatorOption = this.dateOption;
                break;
            case 'date':
                this.operatorOption = this.dateOption;
                this.isDate = true;
                break;

            default:
                this.operatorOption = this.stringOption;
                break;
        }
        return this.operatorOption;
    }

    handleResourceChange(event) {
        if (event.target.value != null) {
            this.isOperatorDisabled = false;
        }
        this.resourceValue = event.target.value;
        this.resourceName = this.filedsList.find(opt => opt.value === event.target.value).label;
        console.log('this.resourceValue:', JSON.stringify(this.resourceValue));
        console.log('this.resourceName:', JSON.stringify(this.resourceName));
        this.getValueType();
    }

    handleOperatorChange(event) {
        if (event.target.value != null) {
            this.isValueDisabled = false;
        }

        this.operatorValue = event.target.value;
        this.operatorName = this.operatorOption.find(opt => opt.value === event.target.value).label;
        console.log('this.operatorValue:', JSON.stringify(this.operatorValue));
    }

    onChangeInputValue(event) {
        let temp = event.target.value;
        if (this.valueType == 'double' || this.valueType == 'currency') {
            this.userInputSearchValue = parseInt(temp);
        }

        this.userInputSearchValue = temp;
        console.log('Value:', JSON.parse(JSON.stringify(this.userInputSearchValue)));
    }

    handleFilter() { // toggle Button Function
        this.filterState = !this.filterState;
    }

    closePopover() { // close using X button
        this.filterState = false;
    }

    deleteFilter(event) {
        let idToDelete = event.target.name;
        console.log('ID:', JSON.stringify(idToDelete));
        let filterCriteriaList = this.filterCriteriaList;
        let filterCriteriaListIndex;
        for (let i = 0; i < filterCriteriaList.length; i++) {
            if (idToDelete === filterCriteriaList[i].id) {
                filterCriteriaListIndex = i;
                console.log('index value:', filterCriteriaListIndex);
            }
        }
        filterCriteriaList.splice(filterCriteriaListIndex, 1);
        console.log('list after splicing', filterCriteriaList);
        this.handlefilterCriteriaListChange(); // will pass filterCriteriaList value to parent
    }

    onAddFilter() // onclick Button
    {
        try {
            // adding component to filterCriteriaList list
            let filterVlaues = {};
            filterVlaues.id = this.trackFielterId;
            this.trackFielterId++;
            filterVlaues.resource = this.resourceValue;
            filterVlaues.operator = this.operatorValue;
            filterVlaues.resourceName = this.resourceName;
            filterVlaues.operatorName = this.operatorName;
            filterVlaues.value = this.userInputSearchValue;
            this.filterCriteriaList.push(filterVlaues);
            this.handlefilterCriteriaListChange(); // will pass filterCriteriaList value to parent

        } catch (error) {
            console.log('error in add  filter:', error);
        }

    }

    onRemoveAll() // onclick Button
    {
        this.filterCriteriaList = [];
        this.handlefilterCriteriaListChange(); // will pass filterCriteriaList value to parent
    }

    getValueType() {
        let field = this.filedsList.filter(key => key.value === this.resourceValue);
        let dataType = JSON.parse(JSON.stringify(field[0]));
        this.valueType = dataType.type;
    }

    resetDefValues() {
        // diable drop box
        this.isOperatorDisabled = true;
        this.isValueDisabled = true;

        // clear all value
        this.resourceValue = null;
        this.operatorValue = null;
        this.userInputSearchValue = null;
    }

    disableBoxOpt() {

    }

    onTakeAction(event) { // AND OR DATA 
        var condi = event.target.value;
        this.actionVal = event.target.value;
        try {
            const newEvents = new CustomEvent("takeactionchnage", {
                detail: condi
            });
            this.dispatchEvent(newEvents);
            console.log('onTakeAction Dispatches the event');
        } catch (error) {
            console.log('onTakeAction' + error);

        }

    }

    onEditFilter(event) // will edit added condition from List
    {
        console.log('event.currentTarget.id:', event.currentTarget.id);
        console.log('event.currentTarget.dataset.id:', event.currentTarget.dataset.id);
        console.log('event.Target.id:', event.target.id);
        console.log('event.Target.dataset.id:', event.target.dataset.id);
    }

    handlefilterCriteriaListChange() {
        // Creates the event with the data.
        try {
            const selectedEvent = new CustomEvent("filtercriteriachange", {
                detail: this.filterCriteriaList
            });
            this.dispatchEvent(selectedEvent);
            console.log('handlefilterCriteriaListChange Dispatches the event');
        } catch (error) {
            console.log('handlefilterCriteriaListChange' + error);

        }

    }
}