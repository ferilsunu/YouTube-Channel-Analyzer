const request = require('request')

const convert =  (n) => {
    if (n < 1e3) return n;
    if (n >= 1e3 && n < 1e6) return +(n / 1e3).toFixed(1) + "K";
    if (n >= 1e6 && n < 1e9) return +(n / 1e6).toFixed(1) + "M";
    if (n >= 1e9 && n < 1e12) return +(n / 1e9).toFixed(1) + "B";
    if (n >= 1e12) return +(n / 1e12).toFixed(1) + "T";
}

module.exports = {
 

    getDashboardRequest: (req, res) => {
        res.redirect('/')
    },
    dashboardPostRequest: (req, res) => {
        const userSearchTerm = req.body.channelName
        const apiURLSearch = 'https://www.googleapis.com/youtube/v3/search?key='+ process.env.API_KEY + '&part=snippet&maxResults=5&type=video&type=channel&sort=asc&q=' + userSearchTerm

        request(apiURLSearch, (error, response, body) => {


            if (error) {
                console.log(error)
            }
            const parsedJsonData = JSON.parse(body)
            const data = parsedJsonData.items[0]
            const channelId = data.id.channelId

            const channelApiURL = ' https://www.googleapis.com/youtube/v3/channels?key='+ process.env.API_KEY +'&part=snippet&part=statistics&part=status&part=brandingSettings&id=' + channelId

            //Recent Videos
            const videos = parsedJsonData.items.map((i) => {
                return {id: i.id.videoId,
                        thumbnails: i.snippet.thumbnails.high.url
                }
            })
            videos.shift()
   

 
           
    

            request(channelApiURL, (error, response, body) => {
                if (error) {
                    return error
                }
                const channelStats = JSON.parse(body).items[0]


                const earning = Math.floor(channelStats.statistics.viewCount * 0.18)
     


                const convertedEarning = convert(earning)
       
                channelStats.statistics.viewCount = convert(channelStats.statistics.viewCount)
                channelStats.statistics.subscriberCount = convert(channelStats.statistics.subscriberCount)

                var isForKids
                if (channelStats.status.madeForKids) {
                    isForKids = "Yes"
                } else {
                    isForKids = "No"
                }


                //Join Date
                const join_date_iso = channelStats.snippet.publishedAt
                const join_date_converted = new Date(join_date_iso)
                const join_date_year = join_date_converted.getFullYear()
                const monthNames = ["January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                ]
                const join_date_month = monthNames[join_date_converted.getMonth()]
                const join_date = join_date_month + " " + join_date_year





                res.render('dashboard', {
                    data,
                    join_date,
                    channelStats,
                    isForKids,
                    convertedEarning,
                    videos
                    
                })



            })




        })




    },




}