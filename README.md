
# Unofficial tool to dump JFC data

## How to use

- Bookmark [this link](javascript://$.getScript('');)
- Open [budget tracker](https://cmu.campuslabs.com/budgeting/)
- Click the bookmark. 
After couple minutes, you will be prompted to save a file.

The file can be processed later by tools from this repository


# API documentation

## List of sumitted budgets
GET: `budgetingapi/submissions/submissions`

Result example:

    [
        { "Id": <int>,
          "Name": <str>,
          "CalculatedAmount": <float>,
          "ProcessName": <str>,  // e.g.: "FY 15 Budget",
          "CreatedOn": <str>, // e.g.: "2014-11-10T09:12:47",
          "Status":{
              "StatusType": <str>, // e.g.: "Approved",
              "CreatedOn": <str>, // e.g.: "2015-01-21T14:01:25"
          },
          "AccountId": <UID>,  // user id
          "CollegiateLinkOrganizationId": <int> or null        
        },
        ...
    ]

## List budgets under review
GET: `/budgetingapi/reviews/reviews`

Result example:

    [
        { Id: <int>,  #budget id, bo be used in get_budget()
          Name: <str>,  # budget name, not org
          CalculatedAmount: <float>, // the REQUESTED amount, not adjusted
          CollegiateLinkOrganizationId: <int>,
          Account: { 
              Id: <UID> 
          },
          Process: { 
              Id: <int>, // e.g. 1396 
              Name: <str>  // e.g. "FY18 JFC Budget Request", same for all budgets in the year
          },
          Status: { 
            StatusType: <str>, // e.g.: "Submitted" 
            CreatedOn: <ISOdate>  // e.g.: "2016-12-31T10:00:01"
          },
          Step: { 
              Name: <str stepname> // e.g. "JFC Rep Recommendation"
          }
        },
        ...
    ]


## Get org name
GET: `/CollegiateLinkAccountInfo/Organizations/ + org_id`

Result example:

     { Id: <int>, 
       Name: <str>, 
       Status: <str>
     }

## Get org names
POST: `/CollegiateLinkAccountInfo/Organizations/getList`

payload: JSON list of org ids

Result example:

    [
        { Id: <int>, 
           Name: <str>, 
           Status: <str>
         },
         ...
    ]


## Get user info
POST: `/budgetingapi/submissions/submissions/GetAccountDetails` 

payload: user UID

Result example:

    { FirstName: <str>,
      LastName: <str>
      Id: <uid>,
      ExternalId: <email>,
      ProfileImageUrl: <str>
    }

## Get budget info
GET: `/budgetingapi/reviews/reviews/ + budget_id`

Result example:

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
