import { LightningElement, wire, api, track } from 'lwc';
import { getRecordNotifyChange } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getFieldsAndRecords from '@salesforce/apex/SearchReplaceController.getFieldsAndRecords';
import updateRecords from '@salesforce/apex/SearchReplaceController.updateRecords';
import { reduceErrors } from 'c/ldsUtils';

export default class SearchReplace_datatable extends LightningElement {

    error;
    @track searchKey = '';
    @track replacetext = [];
    @track allData = []; // Datatable
    allDataOrgCopy = []; // DatatableOrignalCpy
    @track columns;
    @track fieldOption = '';
    @track fieldOptionJSON = []; // list of fields option for combobox
    @track FieldsValue; // default value of combobox
    @track fieldType; // data type
    @api SFDCobjectApiName;
    @api fieldSetName;
    isSearchFlag = false;
    @track filterState = false;
    fieldnames = []; // list of field names
    takeActionConVal; // from child 
    connectedCallback() {
        getFieldsAndRecords({
            strObjectApiName: this.SFDCobjectApiName,
            strfieldSetName: this.fieldSetName
        })
            .then(data => {
                let objStr = JSON.parse(data);
                let listOfFields = JSON.parse(Object.values(objStr)[1]);
                //retrieve listOfRecords from the map
                let listOfRecords = JSON.parse(Object.values(objStr)[0]);
                let items = []; //local array to prepare columns
                listOfFields.map(element => {
                    //fileds for column
                    var datetimeTypeAttr = {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        timezone: 'Asia/Kolkata',
                        hour12: true
                    };
                    var timeTypeAttr = {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        timezone: 'Asia/Kolkata',
                        hour12: true
                    };
                    var dateTypeAttr = {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        timezone: 'Asia/Kolkata',
                        hour12: true
                    };
                    if (element.type == 'datetime' || element.type == "datetime") {
                        items = [...items, {
                            label: element.label,
                            fieldName: element.fieldPath,
                            type: 'date',
                            typeAttributes: datetimeTypeAttr
                        }];
                    } else if (element.type == 'date' || element.type == "date") {
                        items = [...items, {
                            label: element.label,
                            fieldName: element.fieldPath,
                            type: element.type,
                            typeAttributes: dateTypeAttr
                        }];
                    } else if (element.type == 'time' || element.type == "time") {
                        items = [...items, {
                            label: element.label,
                            fieldName: element.fieldPath,
                            type: element.type,
                            typeAttributes: timeTypeAttr
                        }];
                    } else {
                        items = [...items, {
                            label: element.label,
                            fieldName: element.fieldPath,
                            type: element.type
                        }];
                    }
                    // fileds for ComboBox
                    this.fieldOptionJSON = [...this.fieldOptionJSON, {
                        label: element.label,
                        value: element.fieldPath,
                        type: element.type
                    }];
                });
                this.FieldsValue = this.fieldOptionJSON[0].value;
                this.fieldOption = this.fieldOptionJSON[0].value;
                var xx = JSON.stringify(listOfRecords);
                this.allData = JSON.parse(xx);
                this.allDataOrgCopy = JSON.parse(xx);
                this.columns = items;
                console.log('this.columns:', JSON.parse(JSON.stringify(this.columns)));
                console.log('this.allData:', JSON.parse(JSON.stringify(this.allData)));
                this.error = undefined;
            })
            .catch(error => {
                this.error = reduceErrors(error);
                console.log('this.error', this.error);
                this.allData = undefined;
            });
    }

    handelonchange(event) {
        this.replacetext = event.target.value;
    }
    
    handleReplace() { // onClick Replace
        if (this.isSearchFlag && (this.replacetext != '' || this.replacetext == null)) {
            this.isSearchFlag = false;
            let data_to_replace = this.allData;
            data_to_replace.forEach(element => {
                updateRecords({
                    strObjectApiName: this.SFDCobjectApiName,
                    Record_Id: element.Id,
                    Replace_text: this.replacetext,
                    Replace_field: this.fieldOption,
                    field_type: this.fieldType
                })
                    .then(result => {
                        console.log('result:', result);
                        if (result == 'Success') {
                            const evt = new ShowToastEvent({
                                title: 'Success',
                                message: 'Rename Sucessful',
                                variant: 'success',
                                mode: 'dismissable'
                            });
                            this.dispatchEvent(evt);
                        } else {
                            const evt = new ShowToastEvent({
                                title: 'Error',
                                message: result,
                                variant: 'error',
                                mode: 'dismissable'
                            });
                            this.dispatchEvent(evt);
                        }
                    })
                    .catch((error) => {
                        this.error = reduceErrors(error);
                        console.log(' this.error:', this.error);
                        const evt = new ShowToastEvent({
                            title: 'Error',
                            message: 'Error while replace data' + this.error,
                            variant: 'error',
                            mode: 'dismissable'
                        });
                        this.dispatchEvent(evt);
                    });
                getRecordNotifyChange([{ recordId: element.Id }]);
            });
            setTimeout(() => {
                this.connectedCallback();
            }, 1000);
        }
        else {
            let evt = new ShowToastEvent({
                title: 'Warning',
                message: 'Search and Replace text should not be empty',
                variant: 'warning',
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);
        }
    }
    searchDataTable() {
        let searchString = this.searchKey;
        let allRecords = this.allDataOrgCopy;
        let searchResults = [];
        let fieldDataType = this.fieldType; //
        if (fieldDataType == 'double' || fieldDataType == "double") {
            searchResults = allRecords.filter(key => key[this.fieldOption] == parseInt(searchString));
        } else {
            searchResults = allRecords.filter(key => {
                let val = key[this.fieldOption];
                if (String(val).indexOf(searchString) != -1) {
                    return true;
                }
            });
        }
        this.allData = searchResults;
    }
    
    handleKeyChange(event) {
        this.searchKey = event.target.value;
        if (this.searchKey !== null || this.takeActionConVal !== null) {
            this.isSearchFlag = true;
            this.searchDataTable();
        }
        if (this.searchKey == null || this.searchKey == '') {
            this.allData = this.allDataOrgCopy;
            this.isSearchFlag = false;
        }
    }
    
    handleChangeFields(event) {
        // on chnage of combobox value
        this.fieldOption = event.target.value;
        console.log('fieldOption: ' + this.fieldOption);
        let varfieldType = this.fieldOptionJSON.filter(key => key.value === this.fieldOption);
        let dataType = JSON.parse(JSON.stringify(varfieldType[0]));
        this.fieldType = dataType.type;
        console.log(' this.fieldType: ' + dataType.type);
    }
    filterCriteriaChange(event) {
        var filterCriteriaList = (JSON.parse(JSON.stringify(event.detail)));
        console.table(JSON.parse(JSON.stringify(filterCriteriaList)));
        var allRecords = [];
        allRecords = this.allData;
        var filterResults = [];
        if (filterCriteriaList.length == 0) {
            this.allData = this.allDataOrgCopy;
            allRecords = this.allDataOrgCopy;
        }
        if (this.takeActionConVal == 'AND') {
            filterCriteriaList.forEach(filterCriteria => {
                switch (filterCriteria.operator) {
                    case 'lessThan':
                        allRecords = this.allData;
                        filterResults = allRecords.filter(key => key[filterCriteria.resource] < filterCriteria.value);
                        this.allData = filterResults;
                        break;
                    case 'greaterThan':
                        allRecords = this.allData;
                        filterResults = allRecords.filter(key => key[filterCriteria.resource] > filterCriteria.value);
                        this.allData = filterResults;
                        break;
                    case 'lessOrEqual':
                        allRecords = this.allData;
                        filterResults = allRecords.filter(key => key[filterCriteria.resource] <= filterCriteria.value);
                        this.allData = filterResults;
                        break;
                    case 'greaterOrEqual':
                        allRecords = this.allData;
                        filterResults = allRecords.filter(key => key[filterCriteria.resource] >= filterCriteria.value);
                        this.allData = filterResults;
                        break;
                    case 'equals':
                        allRecords = this.allData;
                        filterResults = allRecords.filter(key => key[filterCriteria.resource] == filterCriteria.value);
                        this.allData = filterResults;
                        break;
                    case 'notEquals':
                        allRecords = this.allData;
                        filterResults = allRecords.filter(key => key[filterCriteria.resource] != filterCriteria.value);
                        this.allData = filterResults;
                        break;
                    case 'endsWith':
                        allRecords = this.allData;
                        filterResults = allRecords.filter(key => {
                            let val = key[filterCriteria.resource];
                            String(val).endsWith(filterCriteria.value);
                        });
                        this.allData = filterResults;
                        break;
                    case 'startsWith':
                        allRecords = this.allData;
                        filterResults = allRecords.filter(key => {
                            let val = key[filterCriteria.resource];
                            String(val).startsWith(filterCriteria.value);
                        });
                        this.allData = filterResults;
                        break;
                    case 'empty':
                        allRecords = this.allData;
                        filterResults = allRecords.filter(key => {
                            key[filterCriteria.resource] == 'undefined' ||
                                key[filterCriteria.resource] == null ||
                                key[filterCriteria.resource] == '' ||
                                key[filterCriteria.resource].length <= 0;
                        });
                        this.allData = filterResults;
                        break;
                    case 'contains':
                        allRecords = this.allData;
                        filterResults = allRecords.filter(key => {
                            let val = key[filterCriteria.resource];
                            if (String(val).indexOf(filterCriteria.value) != -1) {
                                return true;
                            }
                        });
                        this.allData = filterResults;
                        break;
                    default:
                        break;
                }
            });
        } else if (this.takeActionConVal == 'OR') {
            var collectorData = [];
            allRecords = this.allDataOrgCopy;
            filterCriteriaList.forEach(filterCriteria => {
                switch (filterCriteria.operator) {
                    case 'lessThan':
                        filterResults = allRecords.filter(key => key[filterCriteria.resource] < filterCriteria.value);
                        filterResults.forEach(key => {
                            collectorData.push(key);
                        });
                        break;
                    case 'greaterThan':
                        filterResults = allRecords.filter(key => key[filterCriteria.resource] > filterCriteria.value);
                        filterResults.forEach(key => {
                            collectorData.push(key);
                        });
                        break;
                    case 'lessOrEqual':
                        filterResults = allRecords.filter(key => key[filterCriteria.resource] <= filterCriteria.value);
                        filterResults.forEach(key => {
                            collectorData.push(key);
                        });
                        break;
                    case 'greaterOrEqual':
                        filterResults = allRecords.filter(key => key[filterCriteria.resource] >= filterCriteria.value);
                        filterResults.forEach(key => {
                            collectorData.push(key);
                        });
                        break;
                    case 'equals':
                        filterResults = allRecords.filter(key => key[filterCriteria.resource] == filterCriteria.value);
                        filterResults.forEach(key => {
                            collectorData.push(key);
                        });
                        break;
                    case 'notEquals':
                        filterResults = allRecords.filter(key => key[filterCriteria.resource] != filterCriteria.value);
                        filterResults.forEach(key => {
                            collectorData.push(key);
                        });
                        break;
                    case 'endsWith':
                        filterResults = allRecords.filter(key => {
                            let val = key[filterCriteria.resource];
                            String(val).endsWith(filterCriteria.value);
                        });
                        filterResults.forEach(key => {
                            collectorData.push(key);
                        });
                        break;
                    case 'startsWith':
                        filterResults = allRecords.filter(key => {
                            let val = key[filterCriteria.resource];
                            String(val).startsWith(filterCriteria.value);
                        });
                        filterResults.forEach(key => {
                            collectorData.push(key);
                        });
                        break;
                    case 'empty':
                        filterResults = allRecords.filter(key => {
                            key[filterCriteria.resource] == 'undefined' ||
                                key[filterCriteria.resource] == null ||
                                key[filterCriteria.resource] == '' ||
                                key[filterCriteria.resource].length <= 0;
                        });
                        filterResults.forEach(key => {
                            collectorData.push(key);
                        });
                        break;
                    case 'contains':
                        filterResults = allRecords.filter(key => {
                            let val = key[filterCriteria.resource];
                            if (String(val).indexOf(filterCriteria.value) != -1) {
                                return true;
                            }
                        });
                        filterResults.forEach(vv => {
                            collectorData.push(vv);
                        });
                        console.log('collectorData:', JSON.stringify(collectorData));
                        break;
                    default:
                        break;
                }
                // duplicate removal logic 
                const uniqueSet = new Set(collectorData);
                this.allData = [...uniqueSet];
                console.log('this.allData OR:', JSON.parse(JSON.stringify(this.allData)));
            });
        }
    }
    takeactionChnage(event) {
        this.takeActionConVal = JSON.parse(JSON.stringify(event.detail));
        console.log('takeActionConVal:', this.takeActionConVal);
    }

}