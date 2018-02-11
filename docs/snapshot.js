(function () { // we don't want to interfere with the campuslab code, so anonymous function
    // This script will download a snapshot of JFC budgets accessible from your account
    // Note that it will not download budgets you don't have access to
    // campuslabs comes with jquery 1.9.1

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
        return _api('/CollegiateLinkAccountInfo/Organizations/' + org_id, 'GET');
    }
    function get_org_names(org_ids) {
        return _api('/CollegiateLinkAccountInfo/Organizations/getList', 'POST', org_ids);
    }
    function get_submitted_budgets() {
        return _api('/budgetingapi/submissions/submissions', 'GET');
    }
    function get_budgets_under_review() {
        return _api('/budgetingapi/reviews/reviews', 'GET');
    }
    function get_budgets_under_review() {
        return _api('/budgetingapi/reviews/reviews', 'GET');
    }
    function get_profile(uid){
        return _api('/budgetingapi/submissions/submissions/GetAccountDetails', 'POST', uid);
    }
    function get_budget(budget_id) {
        return _api('/budgetingapi/reviews/reviews/' + budget_id, 'GET');
    }
    function saveBlob(obj, fileName) {
        // a slightly modified version of https://stackoverflow.com/questions/22724070/
        var a = document.createElement("a");
        a.href = window.URL.createObjectURL(
            new Blob([JSON.stringify(obj, null, 2)], {type : 'application/json'}));
        a.download = fileName;
        a.click();
    }

    var budgets = {};
    var orgs = {};
    var users = {};

    get_budgets_under_review().forEach(function(budget) {
        budgets[budget.Id] = budgets[budget.Id] || get_budget(budget.Id);
        orgs[budget.CollegiateLinkOrganizationId] = orgs[budget.CollegiateLinkOrganizationId] || get_org_name(budget.CollegiateLinkOrganizationId);
        users[budget.AccountId] = users[budget.AccountId] || get_profile(users[budget.AccountId]);
    });
    get_submitted_budgets().forEach(function(budget) {
        budgets[budget.Id] = budgets[budget.Id] || get_budget(budget.Id);
        orgs[budget.CollegiateLinkOrganizationId] = orgs[budget.CollegiateLinkOrganizationId] || get_org_name(budget.CollegiateLinkOrganizationId);
        // the only reason to have duplicated code is this inconsistency in API
        users[budget.Account.Id] = users[budget.Account.Id] || get_profile(users[budget.Account.Id]);
    });

    saveBlob({'budgets': budgets, 'orgs': orgs, 'users': users}, 'jfc_data.json');
})();
