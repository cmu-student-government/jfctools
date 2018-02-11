// This script will download a snapshot of JFC budgets accessible from your account
// Note that it will not download budgets you don't have access to
$.getScript("//cdnjs.cloudflare.com/ajax/libs/PapaParse/4.1.2/papaparse.min.js",

function () { // we don't want to interfere with the campuslab code, so anonymous function
    // INIT
    // campuslabs comes with jquery 1.9.1
    // if ($("#snapshot-form")) {
    //     return $("#snapshot-form").submit();
    // }

    $(document.body).append(
        '<div id="snapshot-dialog" title="Data is being collected" style="display:none">' +
        '<form method="POST" id="snapshot-form" target="_blank"' +
        '   action="//moodle.university.innopolis.ru/schooligan/download.php">' +
        '<input type="hidden" value="" name="data" id="snapshot-data" />' +
        '</form>' +
        '<div class=snapshot-progreessbar"></div></div>');

    function get_cookie(key) {
        var result;
        return (result = new RegExp(
                '(?:^|; )'+encodeURIComponent(key)+'="?([^;"]*)').exec(
                    document.cookie)
            ) ? (result[1]) : null;
    }
    function imap(arr, key, value) {
        var result = new Map(); // ES6 feature; requires at least IE11 or SF10
        arr.forEach(function(item){ result[item[key]] = value? item[value]: item; });
        return result;
    }
    function _api(url, type, data) {
        data = JSON.stringify(data);
        var result = null;
        $.ajax({
            method: type,
            url: url,
            dataType: 'json',
            success: function(data) {result = data},
            data: data,
            async: false,
            headers: {
                'X-XSRF-TOKEN': get_cookie('XSRF-TOKEN'),
                'Content-Type':'application/json;charset=utf-8'
            }
        });
        return result;
    }
    function get_org_name(org_id) {
        // { Id: <int>, Name: <str>, Status: <str>}
        return _api('/CollegiateLinkAccountInfo/Organizations/' + org_id, 'GET');
    }
    function get_org_names(org_ids) {
        // returns list of obj, same format as a single org name
        return _api('/CollegiateLinkAccountInfo/Organizations/getList', 'POST', org_ids);
    }
    function get_budgets() {
        /* This API call returns a list of objects:
        { Id: <int>,  #budget id, bo be used in get_budget()
          Name: <str>,  # budget name, not org
          CalculatedAmount: <float>,           # the REQUESTED amount, not adjusted
          CollegiateLinkOrganizationId: <int>,
          Account: { Id: <UID> },
          Process: { Id: <int>, Name: <str>}   # e.g. 1396, "FY18 JFC Budget Request", same for all budgets in the year
          Status: { StatusType: <str>, CreatedOn: <ISOdate>},  # e.g. "Submitted", "2016-12-31T10:00:01"
          Step: { Name: <str stepname>}  # e.g. "JFC Rep Recommendation"
        }
         */
        return _api('/budgetingapi/reviews/reviews', 'GET');
    }
    function get_profile(uid){
        /*
        { FirstName: <str>,
          LastName: <str>
          Id: <uid>,
          ExternalId: <email>,
          ProfileImageUrl: <str>
        }
         */
        return _api('/budgetingapi/submissions/submissions/GetAccountDetails', 'POST', uid);
    }
    function get_budget(budget_id) {
        /* This API call returns an object:
         { Id: <int>,
         Name: <str>,  # org name
         Description: str,  # one paragraph description, user input
         CollegiateLinkOrganizationId: int, # can be null, perhaps an error in campuslabs
         Amount: <float>  #requested amount
         AdjustmentAmount: <float>  # adjusted amount
         AccountId: <UID>,
         Process: {}
         Submitter: {}
         Status: {
                CreatedOn: ISO_date,
                StatusType: str  # e.g. "Submitted"
            }
         Step: {
                AdjustmentsEnabled: bool,
                CanApprove: bool,
                CanMoveBackward: bool,
                CanMoveForward: bool,
                CanReject: bool,
                CanReturnForRevision: bool,
                Name: str,  # e.g. "Appeals"
                Sequence: int  # kind of progress, refer to history
            }
         StepCount: <int>,  # refer to the History
         ProjectId: <int>
         Responses: [  # mandatory fields: submitter first/last name, andrew id, phone, org name,
                       # position in the organization, name of the JFC rep
             { AnswerText: "Alex",
             QuestionText: "First Name",
             PageName: "Page 1",
             PageSequence: 1,
             QuestionSequence: 3,
             AnswerSequence: 1
             },
             ... # etc, just fields describing the submission
             ],
         History: [
            {   AccountId: <UID>,
                Amount: float,  # initial amount requested
                CreatedOn: ISO_date,
                StatusType: str,  # looks to be always "Submitted"
                Step: {
                    Name: str,  # e.g. "JFC Rep Recommendation" or "Appeals"
                    Sequence: int  # kind of progress, increments with each step
                }
            },
            ...]  # submitted-returned-etc, not important
         Adjustments: [
            {   AccountId: <UID>,
                AdjustmentAmount: float,
                BudgetId: int,  # budget id from .Budgets section?
                CalculatedAdjustmentAmount: float,
                CreatedOn: ISO_date,
                Id: int,  # comment id
                LineItemId: int,
                LineItemName: str,  # e.g. "Baloons"
                LineItemRemoved: bool,
                RequestedAmount: float,  # total requested amount of the budget
                RequestedLineItemAmount: float,  # this specific line amount
                SectionId: int,
                SubmissionId: int,  # budget id
                Text: str  # e.g. "JFC cannot fund this at this time"
            },
            ...]  #
         Comments: [{}, ...]  # general comments without adjustment
         Budgets: [{  # the content of the budget
                Sections: [
                    {   Id: int,  # section id in this budget
                        MaximumAmount: null,
                        MinimumAmount, null,
                        Name: str,  # section name
                        SectionType: str,  # looks to be always "Event/Category", refers to Section Types
                        SectionTypeId: int,  # looks to be always 936
                        LineItems: [
                            {   AdjustmentAmount: null/float,  # null if it was not adjusted, float otherwise
                                CalculatedAdjustmentAmount: null/float,
                                CalculatedPrice: float,  # initial amount requested
                                Description: str,
                                Id: int,  # line item id, used in adjustments
                                LineItemTypeId: int,  # O-code ID, refer to SectionTypes.LineItemTypes
                                MaximumAmount: null,  # looks to be unused
                                MinimumAmount: null,
                                Name: str,  # item name as listed in the budget
                                Price: float,
                                Quantity: int,
                                Removed: bool
                            },
                            ...]
                    },
                    ...]
                SectionTypes: [
                    { SectionTypeId: <int>,
                      SectionType: <str>,
                      LineItemTypes: [  # this is where all O-codes are listed
                          { Id: <int>,
                            Name: <str>, #e.g. "Capital Expense Fund
                            LineItemClassification: <str>  # "Expense" or "Income"
                          },
                          ...]
                    },
                    ...]
            },
            ...]
         }
         */
        return _api('/budgetingapi/reviews/reviews/' + budget_id, 'GET');
    }

    var columns = ['Request id', 'Request Name', 'Org Id', 'Org name',
        'Process name', 'Status', 'Created on', 'Step name',
        'Amount requested', 'Amount adjusted'];
    var budget_requests = get_budgets();
    var org_ids = $.map(budget_requests, function(br){return br.CollegiateLinkOrganizationId});
    var org_names = imap(get_org_names(org_ids), 'Id', 'Name');
    var data = $.map(budget_requests, function(br){
        var org_id=br.CollegiateLinkOrganizationId,
            b = get_budget(br.Id);
        return [[br.Id, br.Name, org_id, org_names[org_id],
            br.Process.Name, br.Status.StatusType, br.Status.CreatedOn, br.Step.Name,
            b.Amount, b.AdjustmentAmount]]
    });

    var csv_data = Papa.unparse({
        fields: columns,
        data: data
    });

    // Finally, download the file:
    $("#snapshot-data").val(csv_data);
    $("#snapshot-form").submit();



});
