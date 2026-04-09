const user = require("./user.json");
const resultDetails = require("./ctrf/ctrf-report.json");

(async () => {
  const userId = user.user_id;
  const taskId = 376;
  const { summary } = resultDetails.results;

  const score = (summary.passed / summary.tests).toFixed(2);

  const results = {
    score,
    taskId,
    userId,
  };

  if (userId == 1234) {
    console.error(`



!!!! DİKKAT: !!!!
User id'nizi user.json dosyasına ekleyin!
User id'nizi nextgen'de projeye tıkladığınızda görebilirsiniz.




`);
    return
  }

  try {
    const response = await fetch(
      "https://coursey-gpt-backend.herokuapp.com/nextgen/taskLog/saveJavaTasks",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(results),
      }
    );

    if (!response.ok) {
      console.error(`


!!! Houston bir hata aldık :(
!!! Status Code: ${response.status} !!!
Slack #teknik-yardım kanalından destek isteyebilirsin.


`);
    }

    if (response.ok) {
      console.log(`


Bu projedeki güncel score'unuz: %${Math.ceil(score*100)}

Başarıyla kaydedildi.
Nextgen'i refresh yaparak kontrol edebilirsiniz.



`);
    }
  } catch (error) {
    console.error("\n!!! Sonuçları yollarken hata oluştu: ", error);
  }
})();