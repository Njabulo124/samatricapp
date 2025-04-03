document.addEventListener('DOMContentLoaded', function () {
    const universityContainer = document.getElementById('universityContainer');
    const emptyMessage = document.getElementById('emptyMessage');
    const qualifiedCourses = JSON.parse(localStorage.getItem('eligibleCourses'));

    const universityData = {
        "University of Cape Town": {
            link: "https://publicaccess.uct.ac.za/psc/public/EMPLOYEE/SA/c/UCT_PUBLIC_MENU.UCT_ONL_HOME_FL.GBL?PAGE=UCT_ONL_ACC_FL",
            courses: []
        },
        "University of the Witwatersrand": {
            link: "https://self-service.wits.ac.za/psc/csprodonl/UW_SELF_SERVICE/SA/c/VC_OA_LOGIN_MENU.VC_OA_LOGIN_FL.GBL?",
            courses: []
        },
        "Stellenbosch University": { link: "https://student.sun.ac.za/applicant-portal/#/auth/login", courses: [] },
        "University of KwaZulu-Natal": { link: "https://erpweb.ukzn.ac.za/pls/ukznint/gen.gw1pkg.gw1view ", courses: [] },
        "University of Pretoria": { link: "https://upnet.up.ac.za/psc/upapply/EMPLOYEE/SA/c/UP_OAP_MENU.UP_OAP_LOGIN_FL.GBL?& ", courses: [] },
        "University of the Free State": { link: "https://apply.ufs.ac.za/Application/SelectionInformation ", courses: [] },
        "University of Johannesburg": { link: "https://registration.uj.ac.za/pls/prodi41/gen.gw1pkg.gw1view ", courses: [] },
        "University of Limpopo": { link: "https://ulc-prod-webserver.ul.ac.za/pls/prodi41/gen.gw1pkg.gw1view ", courses: [] },
        "Nelson Mandela University": { link: "https://apps.mandela.ac.za/e-portal ", courses: [] },
        "North-West University": { link: "https://applynow.nwu.ac.za/OnlineApplication/ ", courses: [] },
        "Rhodes University": { link: "https://ross.ru.ac.za/ ", courses: [] },
        "University of South Africa": { link: "https://myadmin.unisa.ac.za/portal/xlogin ", courses: [] },
        "Walter Sisulu University": { link: "https://applications.wsu.ac.za/ ", courses: [] },
        "University of Zululand": { link: "https://www.cao.ac.za/IDLookup.aspx ", courses: [] },
        "University of Venda": { link: "https://univenierp01.univen.ac.za/pls/prodi41/gen.gw1pkg.gw1viewcd", courses: [] },
        "Sol Plaatje University": { link: "https://www.spu.ac.za/index.php/how-to-apply/ ", courses: [] },
        "Sefako Makgatho Health & Sciences University": { link: "https://onlineapplication.smu.ac.za/pls/prodi41/gen.gw1pkg.gw1view ", courses: [] }
    };

    if (qualifiedCourses && qualifiedCourses.length > 0) {
        // Group courses by university
        qualifiedCourses.forEach(course => {
            if (universityData[course.university_name]) {
                universityData[course.university_name].courses.push(course.course_name);
            }
        });

        // Create dropdown for each university in the specified order
        Object.entries(universityData).forEach(([university, data]) => {
            const courses = data.courses;
            if (courses.length > 0) {
                const universityDiv = document.createElement('div');
                universityDiv.classList.add('university-dropdown');

                const dropdownButton = document.createElement('button');
                dropdownButton.className = 'dropdown-button';
                dropdownButton.innerText = university;

                const courseList = document.createElement('div');
                courseList.className = 'course-list';
                courseList.style.display = 'none';

                const link = document.createElement('a');
                link.href = data.link;
                link.target = '_blank'; // Open link in new tab
                link.innerText = "Application Link";
                link.className = 'application-link';

                courses.forEach(course => {
                    const courseItem = document.createElement('div');
                    courseItem.className = 'course-item';
                    courseItem.innerText = course;
                    courseList.appendChild(courseItem);
                });

                dropdownButton.onclick = () => {
                    const isDisplayed = courseList.style.display === 'block';
                    courseList.style.display = isDisplayed ? 'none' : 'block';
                    link.style.display = isDisplayed ? 'none' : 'block'; // Toggle link visibility
                };

                universityDiv.appendChild(dropdownButton);
                universityDiv.appendChild(link); // Add application link to university div
                universityDiv.appendChild(courseList);
                universityContainer.appendChild(universityDiv);
            }
        });
    } else {
        emptyMessage.style.display = 'block';
    }
});
