async function getRoleList()
{
    return (
    [
        {
            type: "genre",
            roles: [
                {
                    name: "homme",
                    id: "1234937665879539736"
                },
                {
                    name: "non-binaire",
                    id: "1234937665879539734"
                }
            ]
        },
        {
            type: "age",
            roles: [
                {
                    name: "18 - 21 ans",
                    id: "1236436265377861723"
                },
                {
                    name: "22 - 25 ans",
                    id: "1236436266430759117"
                },
                {
                    name: "26 - 30 ans",
                    id: "1236436267298848828"
                },
                {
                    name: "30 - 40 ans",
                    id: "1236436268993220678"
                },
                {
                    name: "40 - 50 ans",
                    id: "1236436270566346842"
                },
                {
                    name: "50 ou +",
                    id: "1236436272587866254"
                }
            ]
        },
        {
            type: "orientation",
            roles: [
                {
                    name: "Gay",
                    id: "1234937665799852218"
                },
                {
                    name: "Bi",
                    id: "1234937665799852217"
                }
            ]
        },
        {
            type: "taille",
            roles: [
                {
                    name: "Petite",
                    id: "1234937665762365568"
                },
                {
                    name: "Moyenne",
                    id: "1234937665762365567"
                },
                {
                    name: "Grande",
                    id: "1234937665762365566"
                }
            ]
        },
        {
            type: "taille (CM)",
            roles: [
                {
                    name: "- 10 cm",
                    id: "1234937665724350522"
                },
                {
                    name: "10 - 12 cm",
                    id: "1234937665724350521"
                },
                {
                    name: "12 - 14 cm",
                    id: "1234937665724350520"
                },
                {
                    name: "14 - 16 cm",
                    id: "1234937665724350519"
                },
                {
                    name: "16 - 18 cm",
                    id: "1234937665724350518"
                },
                {
                    name: "18 cm ou +",
                    id: "1234937665724350517"
                }
            ]
        },
        {
            type: "jspas",
            roles: [
                {
                    name: "je nude",
                    id: "1234937665678217239"
                },
                {
                    name: "avec affinité",
                    id: "1234937665678217238"
                },
                {
                    name: "je nude pas",
                    id: "1234937665678217237"
                },
                {
                    name: "je mate",
                    id: "1234937665623953457"
                }
            ]
        },
        {
            type: "situation",
            roles: [
                {
                    name: "célibataire",
                    id: "1234937665623953455"
                },
                {
                    name: "en couple",
                    id: "1234937665623953454"
                },
                {
                    name: "compliqué",
                    id: "1234937665623953453"
                }
            ]
        },
        {
            type: "mp",
            roles: [
                {
                    name: "MP ouvert",
                    id: "1234937665623953451"
                },
                {
                    name: "MP sur demande",
                    id: "1234937665623953450"
                },
                {
                    name: "MP fermé",
                    id: "1234937665623953449"
                }
            ]
        },
    ]
    )
}
module.exports = {
    getRoleList
};