/**
 * @author            : Vrushabh Uprikar
 * @last modified on  : 27-07-2021
 * @last modified by  : Vrushabh Uprikar
**/
import { LightningElement, api,track } from 'lwc';
const areSame = (obj1, obj2) => obj1 === obj2;

export default class Picklist extends LightningElement
{

    @api label;
    @api placeholder;
    @api options;
    @api value;
    @api context; // nothing but account ID , object ID
    @api apiname;
    @api depvalue;
    tempObj = {label:'None', value:'None'};
    @track final_dep_op;
    connectedCallback()
    {
        //console.log('depvalue', JSON.stringify(this.final_dep_op));
        
        this.final_dep_op = this.depvalue;
        console.log('depvalue', JSON.stringify(this.depvalue));
        
        if(this.value === undefined)
        {
            this.tempObj.isSelected = true;
        }else
        {
            this.tempObj.isSelected = false;
        }
        // console.log(JSON.stringify(this.tempObj));
        this.options = this.options.map(option =>
            Object.assign({}, option, {isSelected : areSame(option.value, this.value)}));
        this.options.unshift(this.tempObj);
        console.log('option id',JSON.stringify(this.options));

        // this.depvalue = this.depvalue.map(option =>
        //     Object.assign({}, option, {isSelected : areSame(option.value, this.value)}));
        //this.depvalue.unshift(this.tempObj);
        // console.log('depvalue id',JSON.stringify(this.depvalue));
       // console.log('Field api name : ', this.apiname);

        // console.log('options list ===> ',JSON.stringify(this.options));
    }

    updateDependentOptions(){

     }

    handleChange(event) {
        //show the selected value on UI
        this.value = event.target.value;
        console.log("Value from datatable is "+this.value)
        console.log("Context of this value is : "+this.context);
        let apinm = JSON.parse(JSON.stringify(this.apiname));
        //console.log("apiname:" + apinm);
        console.log('apiname', JSON.stringify(this.apiname));
        // var dep_options = [];
        //var final_dep_op = [];
        console.log('depvalue', JSON.stringify(this.depvalue));
        // this.depvalue.forEach(op => {
        // dep_options = Object.values(op);
        // });
        // console.log('dependent options'+JSON.stringify(dep_options));
        
        //this.final_dep_op = 
        //dep_options[0][this.value];
       // this.final_dep_op.push(tempObj);
        // console.log('final_dep_op',JSON.stringify(this.final_dep_op));
          


        //console.log('dependent options outside for each'+this.dep_options);
        // this.dep_options.forEach(dopt =>{
        // final_dep_op1 = dopt[this.value];
        // console.log('final_dep_op1'+JSON.stringify(final_dep_op1));
        //   });

        //fire event to send context and selected value to the data table
        const pickListChangeEvent = new CustomEvent('picklistchanged',{
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