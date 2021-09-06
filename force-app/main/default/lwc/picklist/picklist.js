import { LightningElement, api, track } from 'lwc';
const areSame = (obj1, obj2) => obj1 === obj2;

export default class Picklist extends LightningElement {

    @api label;
    @api placeholder;
    @api options;
    @api value;
    @api context; // nothing but account ID , object ID
    @api apiname;

    @api dependentoption;
    @api dependentvalue;
    @api childapi;
    @track disp_Opt=[];

    tempObj = { label: 'None', value: 'None' };
    /**
     * @description       : To Retrive And load the Picklist values.
     * @author            : Vivek Raj
     * @last modified on  : 02-09-2021
    **/
    connectedCallback() {

        console.log('dependentoption : ' + JSON.stringify(this.dependentoption));
        console.log('dependentvalue : ' + JSON.stringify(this.dependentvalue));
        console.log('child Api : ' + JSON.stringify(this.childapi));
        if (this.value === undefined) {
            this.tempObj.isSelected = true;
        } else {
            this.tempObj.isSelected = false;
        }

        this.options = this.options.map(option =>
            Object.assign({}, option, { isSelected: areSame(option.value, this.value) }));
        this.options.unshift(this.tempObj);

        console.log('this.dependentoption bfore: ', JSON.stringify(this.dependentoption));
        if (this.value === undefined) {
            this.tempObj.isSelected = true;
            this.disp_Opt.push(this.tempObj);
        }else{
            this.disp_Opt = this.dependentoption[this.childapi][this.value];
        }

    
        console.log('this.options  ' + JSON.stringify(this.options));
        console.log(' this.disp_Opt ' + JSON.stringify(this.disp_Opt));
        console.log('this.dependentoption after: ', JSON.stringify(this.dependentoption));
    }

    /**
     * @description       : 
     * @author            : Vivek Raj
     * @last modified on  : 02-09-2021
    **/
    handleChange(event) 
    {
        //show the selected value on UI
        this.value = event.target.value;
        console.log("Value from datatable is " + this.value)
        console.log("Context of this value is : " + this.context);
        let apinm = JSON.parse(JSON.stringify(this.apiname));
        //console.log("apiname:" + apinm);
        console.log('apiname', JSON.stringify(this.apiname));
        //var dep_options = [];
        //var final_dep_op = [];
        // this.dependentoption.forEach(op => {
        //     dep_options = Object.values(op);
        // });
        // console.log('dependent options' + JSON.stringify(dep_options));

        if (this.value === 'None') {
            this.disp_Opt = [];
            this.tempObj.isSelected = true;
            this.disp_Opt.push(this.tempObj);
        }else{
            this.disp_Opt = this.dependentoption[this.childapi][this.value];        }
       
        console.log('this.disp_Opt', JSON.stringify(this.disp_Opt));

        //fire event to send context and selected value to the data table
        const pickListChangeEvent = new CustomEvent('picklistchanged', {
            composed: true,
            bubbles: true,
            cancellable: true,
            detail: {
                data: {
                    context: this.context,
                    value: this.value,
                    apiname: apinm
                }
            }
        });
        this.dispatchEvent(pickListChangeEvent);
    }

}