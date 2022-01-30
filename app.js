// Provide the path/link to your Twitter archive's likes JSON file
const jsonLikesFile = '';

const container = document.querySelector('.container');
const db = new PouchDB('tweets');
const options = { include_docs: true, limit: 5 };
let isScrolled = false;
let pageSize = 5;
let lastSeq = 0;

window.addEventListener('scroll', () => {
	const { scrollHeight, scrollTop, clientHeight } = document.documentElement;
	if ((scrollTop + clientHeight > scrollHeight - 20) && !isScrolled) {
		isScrolled = true;
		setTimeout(fetchNextPage, 6000);
	}
});

let createTweet = function(data) {
	let tweet = document.getElementById(data.tweetId);

	twttr.widgets.createTweet(data.tweetId, tweet, {
		conversation: "none", // or all
		cards: "hidden", // or visible
		linkColor: "#cc0000", // default is blue
		theme: "light", // or dark
	});
};

let fetchNextPage = function() {
	let results;
	db.changes({
		since: lastSeq,
		limit: pageSize,
		include_docs: true
	}).then(function (changes) {
		results = changes.results;
		for (let i = 0; i < results.length; i++) {
			row = results[i].doc;
			post = document.createElement('div');
			post.className = 'tweet';
			post.setAttribute("id", row.tweetId);
			post.setAttribute("rowId", row._id);
			container.appendChild(post);
			createTweet(row);
		}

		lastSeq = results[results.length - 1].seq;
		isScrolled = false;
	}).catch(err => {
		console.log("fetchNextPage error:", err);
		isScrolled = false;
	});
};

let populateDB = function(data) {
	let likes = [];
	let like;
	let rowID;
	for (let i = 0; i < data.length; i++) {
		rowID = (i+1).toString();
		like = data[i].like;
		likes.push({
			_id: rowID,
			tweetId : like.tweetId,
			text: like.fullText,
			link: like.expandedUrl
		});
	}
	db.bulkDocs(likes).then(function (result) {
	  console.log("Batch update success");
	}).catch(function (err) {
	  console.log("bulkDocs error:", err);
	});
	fetchNextPage();
};

fetch(jsonLikesFile).then(response => {
	return response.json();
}).then(data => {
	populateDB(data);
}).catch(err => {
	console.log("fetch error:", err);
});
