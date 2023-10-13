// // Get SMS body and number
// const body = global('SMSRB');
// const number = global('SMSRF');
// const actualConfig = JSON.parse(global('actualConfig'));
//
// // Get today's date in 'YYYY-MM-DD' format
// const [date] = new Date().toISOString().split('T');
//
// // GET YNAB Budget ID and YNAB Api Token
// const {apiToken, budget: {id: budget_id}} = ynabConfig || {};
//
// // Get YNAB account ID
// const {id: account_id = 'unknown'} = ynabConfig.budget[number] || {};
//
// // Define RegEx to extract spent amount
// const regex = /\$([\d\.]+)/;
//
// // Create new regex based on the configured regex and match against SMS body
// const re = new RegExp(regex);
// const matches = body.match(re);
//
// const error = matches && matches.length === 2 ? undefined : 'No matches found';
// setLocal('error', error);
//
// if (!error) {
//     // extract amount and payee
//     const amount = matches && matches.length === 2 && parseFloat(matches[1]) * -1000 || 0;
//
//     // compile YNAB transaction payload
//     const payload = {
//         transaction: {
//             account_id,
//             date,
//             amount,
//             memo: 'entered by Tasker'
//         }
//     };
//     setLocal('payload', JSON.stringify(payload));
//     setLocatl('budget_id', budget_id);
//     setLocatl('api_token', apiToken);
// }