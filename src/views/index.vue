<template>
    <div class="home overflow-x-scroll">
        <div class="content_box  min-w-[1105px]">
            <div class="analyse">
                <div class="a_2" style="margin-left: unset;">
                    <div class="title">
                        <div class="after orange"></div>
                        <p>聊天端口</p>
                    </div>

                    <div class="model_new">
                        <div class="m_big big2">
                            <div class="big_top">
                                <div class="big_title">
                                    <p>端口总数</p>
                                    <p>450</p>
                                </div>
                                <div class="big_p text-[var(--el-text-color-placeholder)]">
                                    <!-- <p>有效期至：{{ '2024-11-30' }}</p> -->
                                </div>
                            </div>
                            <div class="chart flex-1">
                                <Chart :options="options1" />
                            </div>
                        </div>
                        <div class="m_small">

                            <div v-for="item in options1.series[0].data">
                                <p>{{ item.name }}</p>
                                <p>{{ item.value }}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="a_2">
                    <div class="title">
                        <div class="after orange"></div>
                        <p>任务端口</p>
                    </div>

                    <div class="model_new">
                        <div class="m_big big2">
                            <div class="big_top">
                                <div class="big_title">
                                    <p>端口总数</p>
                                    <p>450</p>
                                </div>
                                <div class="big_p text-[var(--el-text-color-placeholder)]">
                                    <!-- <p>有效期至：{{ '2024-11-30' }}</p> -->
                                </div>
                            </div>
                            <div class="chart flex-1">
                                <Chart :options="options99" />
                            </div>
                        </div>
                        <div class="m_small">

                            <div v-for="item in options99.series[0].data">
                                <p>{{ item.name }}</p>
                                <p>{{ item.value }}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="a_2">
                    <div class="title">
                        <div class="after orange"></div>
                        <p>账号</p>
                    </div>
                    <div class="model_new">
                        <div class="m_big">
                            <div class="big_top">
                                <div class="big_title">
                                    <p>账号总数</p>
                                    <p>{{ indexWs.ws }}</p>
                                </div>
                                <!-- <p>帐号状态</p> -->
                            </div>
                            <div class="chart  flex-1">
                                <Chart :options="options2" />
                            </div>
                        </div>
                        <div class="m_small">
                            <div v-for="item in options2.series[0].data">
                                <p>{{ item.name }}</p>
                                <p>{{ item.value }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="analyse">
                <div class="a_1">
                    <div class="title">
                        <div class="after blue"></div>
                        <p>粉丝</p>
                    </div>
                    <div class="model_1">
                        <div class="m-1">
                            <div class="m_1_text">
                                <p>粉丝总数</p>
                                <p>{{ indexFan.total_fan }}</p>
                            </div>
                        </div>
                        <div class="flex_item">
                            <div class="m-2 fristModel">
                                <div class="m_2_text">
                                    <p>会话数</p>
                                    <p>{{ indexFan.initiative_fan }}</p>
                                    <p>今日会话 {{ indexFan.initiative_fan_today }}</p>
                                </div>
                            </div>
                            <div class="m-2 lastModel">
                                <div class="m_2_text">
                                    <p>增粉数</p>
                                    <p>{{ indexFan.passive_fan }}</p>
                                    <p class="lastText">
                                        今日增粉 {{ indexFan.passive_fan_today }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="blasting" style="margin: 5px 0 0 0">

                    <div class="title">
                        <div class="after purple"></div>
                        <p>爆粉</p>
                    </div>
                    <div class="fullBox">
                        <div class="f_model">
                            <p class="f_title">爆粉群发</p>
                            <div class="f_fun">
                                <div>
                                    <p>爆粉任务</p>
                                    <p>{{ 71 }}</p>
                                </div>
                                <div>
                                    <p>爆粉次数</p>
                                    <p>{{ 71 }}</p>
                                </div>
                                <div>
                                    <p>今日爆粉</p>
                                    <p>{{ 15 }}</p>
                                </div>
                            </div>
                        </div>
                        <div class="f_model">
                            <p class="f_title">粉丝群发</p>
                            <div class="f_fun">
                                <div>
                                    <p>粉丝群发任务</p>
                                    <p>{{ 69 }}</p>
                                </div>
                                <div>
                                    <p>群发次数</p>
                                    <p>{{ 13 }}</p>
                                </div>
                                <div>
                                    <p>今日群发</p>
                                    <p>{{ 86 }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";

import { getToken } from "@/utils/auth";
import useUserStore from '@/store/modules/user'
import * as echarts from "echarts";
import Chart from "@/components/Echarts/Echarts.vue";
const indexFan = ref({
    initiative_fan: 0,
    passive_fan: 0,
    total_fan: 0,
    initiative_fan_today: 0,
    passive_fan_today: 0
});
const indexWs = ref({ ws: 1000 });
const options1 = reactive({
    tooltip: {
        trigger: "item",
    },
    legend: {
        top: "40%",
        left: "10%",
        orient: "vertical",
    },
    color: ["#4162FF", "#118DFF", "#CCC"],
    series: [
        {
            type: "pie",
            center: ["80%", "50%"],
            radius: ["30%", "70%"],
            avoidLabelOverlap: false,
            label: {
                show: false,
                // position: "center",
            },
            emphasis: {
                label: {
                    show: false,
                    fontSize: 20,
                    fontWeight: "bold",
                },
            },
            labelLine: {
                show: false,
            },
            data: [
                { value: 1048, name: "使用" },
                { value: 735, name: "空闲" },
                { value: 580, name: "过期" },
            ],
        },
    ],
});
const options99 = reactive({
    tooltip: {
        trigger: "item",
    },
    legend: {
        top: "40%",
        left: "10%",
        orient: "vertical",
    },
    color: ["#4162FF", "#6748ac", "#FBC459", "#ccc", "#EB4432"],
    series: [
        {
            type: "pie",
            center: ["80%", "50%"],
            radius: ["30%", "70%"],
            avoidLabelOverlap: false,
            label: {
                show: false,
                // position: "center",
            },
            emphasis: {
                label: {
                    show: false,
                    fontSize: 20,
                    fontWeight: "bold",
                },
            },
            labelLine: {
                show: false,
            },
            data: [
                { value: 1048, name: "爆粉群发" },
                { value: 1048, name: "粉丝群发" },
                { value: 1048, name: "养号" },
                { value: 735, name: "空闲" },
                { value: 580, name: "过期" },
            ],
        },
    ],
});
const options2 = reactive({
    tooltip: {
        trigger: "item",
    },
    legend: {
        top: "30%",
        left: "10%",
        orient: "vertical",
    },
    color: ["#4162FF", "#FBC459", "#EB4432", "#ccc"],
    series: [
        {
            type: "pie",
            center: ["80%", "50%"],
            radius: ["30%", "70%"],
            avoidLabelOverlap: false,
            label: {
                show: false,
                // position: "center",
            },
            emphasis: {
                label: {
                    show: false,
                    fontSize: 20,
                    fontWeight: "bold",
                },
            },
            labelLine: {
                show: false,
            },
            data: [
                { value: 7, name: "在线" },
                { value: 20, name: "离线" },
                { value: 10, name: "封号" },
                { value: 10, name: "被挤" },
            ],
        },
    ],
});
// const getData = async () => {
//   let res = await indexApi();
//   indexFan.value = res.data.fan;
//   indexWs.value = res.data.ws
// };
const mockList = ref([
    {
        num: 100,
        day: 109,
        date: "2024-12-21",
    },
    {
        num: 100,
        day: 24,
        date: "2024-12-21",
    },
    {
        num: 200,
        day: 36,
        date: "2024-12-21",
    },
    {
        num: 300,
        day: 94,
        date: "2024-12-21",
    },
    {
        num: 120,
        day: 94,
        date: "2024-12-21",
    },
    {
        num: 70,
        day: 94,
        date: "2024-12-21",
    },
    {
        num: 100,
        day: 207,
        date: "2024-12-21",
    },
]);

onMounted(() => {
    // getData();
    // const userId =useUserStore().id;
    // const socket = io(`http://192.168.0.11:9099?token=${getToken()}&userId=${userId}`
    //     // , {
    //     //     // withCredentials: true,
    //     //     extraHeaders: {
    //     //         "authorization": 'Bearer ' + getToken()
    //     //     }
    //     // }
    // );
    // let count = 0;
    // let timer = null;
    // timer = setInterval(() => {
    //     socket.volatile.emit("ping", ++count);
    // }, 1000);
    // socket.on("pong", (data) => {
    //     console.log(data);
    // });
    // setTimeout(() => {
    //     clearInterval(timer);
    // }, 20000);

});
</script>

<style lang="scss" scoped>
.home {
    width: 100%;
    padding: 1rem;
    overflow: auto;
    // background: url('@/assets/images/backg.png') no-repeat;
    background-size: cover;
    font-size: 16px;

    &::-webkit-scrollbar {
        display: none;
    }

    .title {
        display: flex;
        align-items: center;
        color: var(--el-text-color-primary);
        font-size: 20px;
        font-weight: 900;
        margin: 10px 0;

        &>p {
            margin: 0;
        }

        .after {
            width: 4px;
            height: 14px;
            margin: 0 5px 0 0;
        }

        .blue {
            background-color: #4162FF;
        }

        .orange {
            background-color: #FF9900;
        }

        .purple {
            background-color: #8851FF;
        }
    }

    .content_box {
        width: 100%;
        height: 100%;

        .analyse {
            width: 100%;
            height: calc(6.3 * 66.67px);
            display: flex;
            align-items: center;
            justify-content: space-between;

            .a_1 {
                width: 48%;
                height: 100%;

                .model_1 {
                    background-color: var(--el-bg-color-page);
                    border-radius: 8px;
                    padding: 15px;
                    height: 90%;
                    color: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-direction: column;

                    .m-1 {
                        background: url("@/assets/images/1.png") no-repeat;
                        background-size: cover;
                        width: 100%;
                        height: 35%;
                        border-radius: 8px;
                        position: relative;

                        .m_1_text {
                            position: absolute;
                            left: 30%;
                            top: 50%;
                            transform: translate(-50%, -50%);

                            &>p:first-child {
                                font-size: calc(0.28 * 66.67px);
                                font-weight: 600;
                            }

                            &>p:last-child {
                                font-size: calc(0.38 * 66.67px);
                                font-weight: 800;
                                margin: 5px 0 0 0 !important;
                            }
                        }
                    }
                }

                .flex_item {
                    width: 100%;
                    height: 62%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;

                    .fristModel {
                        background: url("@/assets/images/2.png") no-repeat;
                    }

                    .lastModel {
                        background: url("@/assets/images/3.png") no-repeat;
                    }

                    .m-2 {
                        width: 48%;
                        background-size: cover;
                        border-radius: 8px;
                        height: 100%;
                        position: relative;
                        margin: 10px 0 0;
                        text-align: center;

                        .m_2_text {
                            position: absolute;
                            left: 50%;
                            top: 50%;
                            transform: translate(-50%, -50%);

                            &>p:first-child {
                                font-size: calc(0.28 * 66.67px);
                                font-weight: 600;
                            }

                            &>p:nth-child(2) {
                                font-weight: 800;
                                font-size: calc(0.32 * 66.67px);
                                margin: 5px 0 0 0 !important;
                            }

                            &>:last-child {
                                display: flex;
                                padding: 5px calc(0.08 * 66.67px);
                                align-items: flex-start;
                                gap: 12px;
                                border-radius: 5px;
                                font-size: calc(0.21 * 66.67px);
                                background: rgba(255, 92, 0, 0.40);
                                margin: 15px 0 0 !important;
                            }

                            .lastText {
                                background: rgba(49, 45, 253, 0.40);
                            }
                        }
                    }
                }
            }

            .a_2 {
                width: 100%;
                height: 100%;
                margin: 0 0 0 20px;
                color: var(--el-text-color-primary);

                // .newmodels {
                //     width: 100%;
                //     height: 90%;
                //     display: flex;
                //     justify-content: space-between;
                //     font-size: calc(0.16 * 66.67px);

                .model_new {
                    // width: 49%;
                    // height: 100%;
                    // display: flex;
                    // justify-content: space-between;
                    width: 100%;
                    height: 90%;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    font-size: calc(0.16 * 66.67px);

                    p {
                        margin: 0;
                    }

                    .m_big {
                        width: 100%;
                        height: 70%;
                        background-color: var(--el-bg-color-page);
                        border-radius: 8px;
                        padding: 20px;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;

                        .big_top {
                            width: 100%;
                            display: flex;
                            justify-content: space-between;

                            .big_title {
                                font-weight: bold;
                                font-size: calc(0.22 * 66.67px);
                                text-align: center;
                                line-height: calc(0.30 * 66.67px);
                            }

                            .big_p {
                                font-size: calc(0.18 * 66.67px);
                                line-height: calc(0.3 * 66.67px);

                                &>p:last-child {
                                    // color: #4162FF;
                                    cursor: pointer;

                                    &:hover {
                                        // opacity: 0.8;
                                    }
                                }
                            }

                            &>p:last-child {
                                cursor: pointer;

                                &:hover {
                                    opacity: 0.8;
                                }
                            }
                        }
                    }

                    .big2 {
                        height: 70%;
                    }
                    

                    .m_small {
                        width: 100%;
                        height: 26%;
                        background-color: var(--el-bg-color-page);
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 0 10px;

                        &>div {
                            width: 45%;
                            text-align: center;
                            font-size: 15px;
                            line-height: calc(0.32 * 66.67px);

                            &>p:first-child {
                                font-weight: bold;
                            }
                        }
                    }

                    .small2 {
                        width: 100%;
                        height: 26% !important;
                        flex-direction: column;
                        padding-bottom: 5px;
                        justify-content: flex-start;

                        position: relative;



                        .title_b {
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            background-color: var(--el-bg-color-page);
                            padding-top: 10px;
                            position: sticky;
                            top: 0;
                            right: 0;
                            width: 100%;

                            p {
                                font-weight: bold !important;
                                min-width: 100px;
                                height: calc(0.3 * 66.67px);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                            }
                        }

                        .newList {
                            width: 100%;
                            height: 100%;
                            padding: 3px 6px 10px;
                            overflow-y: auto;
                            overflow-x: hidden;

                            &::-webkit-scrollbar {
                                width: 6px;
                            }

                            // 滚动条轨道
                            &::-webkit-scrollbar-track {
                                background: rgb(239, 239, 239);
                                border-radius: 2px;
                            }

                            // 小滑块
                            &::-webkit-scrollbar-thumb {
                                background: #2d2d2e49;
                                border-radius: 10px;
                            }

                            &::-webkit-scrollbar-thumb:hover {
                                background: #6b6b6b49;
                            }

                            .newList_item {
                                padding: 3px 0;
                                display: flex;
                                align-items: center;
                                justify-content: space-between;
                                border-radius: 5px;
                                font-size: calc(0.22 * 66.67px);

                                &:nth-child(odd) {
                                    background-color: var(--el-bg-color-overlay);
                                }

                                p {
                                    min-width: 88px;
                                }
                            }
                        }
                    }
                }

                // }
            }

            .blasting {
                width: 100%;
                padding-left: 20px;
            }
        }

        .fullBox {
            width: 100%;
            height: 378px;
            background-color: var(--el-bg-color-page);
            border-radius: 8px;
            padding: 15px;
            display: flex;
            justify-content: space-between;
            flex-direction: column;

            .f_model {
                height: 48%;
                display: flex;
                align-items: center;
                justify-content: space-between;

                .f_title {
                    width: 264px;
                    color: var(--el-text-color-primary);
                    font-size: 15px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                }

                .f_fun {
                    width: 80%;
                    height: 100%;
                    display: flex;
                    flex: 1;
                    align-items: center;
                    justify-content: space-between;
                    background-color: var(--el-bg-color-overlay);
                    border-radius: 8px;

                    &>div {
                        height: 100%;
                        width: 25%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-direction: column;

                        &>p:first-child {
                            font-size: calc(0.23 * 66.67px);
                            font-weight: 600;
                            opacity: 0.6;
                            margin: 0;
                        }

                        &>p:last-child {
                            font-size: calc(0.32 * 66.67px);
                            font-weight: 700;
                            color: var(--el-text-color-primary);
                            margin: 0;
                        }
                    }
                }
            }
        }
    }
}

.chat {
    width: 100%;
    min-width: 1300px;
    padding: calc(0.2 * 66.67px) 0.2rem 0;
    overflow: auto;
    // background: url('@/assets/images/backg.png') no-repeat;
    background-size: cover;
    display: flex;
    font-size: calc(0.16 * 66.67px);

    .list1 {
        width: 15%;
        min-width: 190px;
        height: 97%;
        border-radius: 10px;

        .contactList1 {
            width: 100%;
            max-height: 800px;
            overflow: auto;
            font-size: 13px;

            .list_item1 {
                width: 100%;
                height: 50px;
                cursor: pointer;
                display: flex;
                align-items: center;
                border-radius: 20px;
                padding: 0 calc(0.05 * 66.67px);
                overflow: hidden;

                .list_left {
                    display: flex;
                    align-items: center;

                    &>p {
                        margin: 0 calc(0.1 * 66.67px);
                    }
                }

                &:hover {
                    background-color: #EBEDF2;
                }

            }

            .list_item1_ac {
                width: 100%;
                height: 50px;
                cursor: pointer;
                display: flex;
                align-items: center;
                border-radius: 10px;
                background-color: #4162FF;
                color: #fff;
                padding: 0 calc(0.05 * 66.67px);
                overflow: hidden;

                .avaterImg {
                    position: relative;

                    .on-line {
                        position: absolute;
                        right: 0;
                        top: 0;
                        background-color: #00c637;
                        border-radius: 50%;
                        width: 10px;
                        height: 10px;
                        z-index: 1;
                        box-shadow: 0px 0px 6px #fff;
                    }

                    .no-line {
                        position: absolute;
                        right: 0;
                        top: 0;
                        background-color: red;
                        border-radius: 50%;
                        width: 10px;
                        height: 10px;
                        z-index: 1;
                        box-shadow: 0px 0px 6px #fff;
                    }
                }

                .list_left {
                    display: flex;
                    align-items: center;

                    &>p {
                        margin: 0 calc(0.1 * 66.67px);
                    }
                }
            }
        }

    }

    .chat_content {
        width: 70%;
        height: 97%;
        background-color: #EBEDF2;
        border-radius: 20px;
        display: flex;
        align-items: center;
        margin: 0 10px;
        overflow: hidden;

        .chat_left {
            width: 26%;
            min-width: 280px;
            height: 100%;

            .searchInput2 {
                width: 90%;
                border-radius: 10px;
                margin: 0 5% 10px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            :deep(.el-input__wrapper) {
                height: 32px;
                background-color: rgba(255, 255, 255, 0);
            }

            .contactList2 {
                width: 100%;
                height: calc(7.40 * 66.67px);
                overflow: auto;
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                padding: 0 0 30px 0;

                &::-webkit-scrollbar {
                    display: none;
                }

                .list_item2 {
                    width: 96%;
                    height: 73px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: calc(0.1 * 66.67px);

                    &:hover .item_time,
                    &:hover .list2_head>div>p:last-child {
                        color: var(--el-text-color-primary);
                    }

                    .list2_head {
                        display: flex;
                        align-items: center;

                        &>div {
                            line-height: calc(0.27 * 66.67px);
                            font-weight: 400;
                            margin: 0 calc(0.05 * 66.67px);

                            &>p {
                                margin: 0;
                            }

                            &>p:first-child {
                                color: var(--el-text-color-primary);
                                font-size: calc(0.16 * 66.67px);
                            }

                            &>p:last-child {
                                font-size: calc(0.12 * 66.67px);
                                color: #666;
                                width: 100px;
                                white-space: nowrap;
                                overflow: hidden;
                                text-overflow: ellipsis;
                            }
                        }
                    }

                    .item_time {
                        height: 100%;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-around;
                        align-items: flex-end;
                        line-height: calc(0.26 * 66.67px);
                        font-size: calc(0.12 * 66.67px);
                        color: #666;

                        p {
                            margin: 0;
                            white-space: nowrap;
                        }

                        &>img {
                            width: 18px;
                            height: 18px;
                        }
                    }
                }

                .list_item2_ac {
                    width: 96%;
                    height: 73px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background-color: var(--el-bg-color-page);
                    border-radius: 10px 0 0 10px;
                    padding: calc(0.1 * 66.67px);

                    .list2_head {
                        display: flex;
                        align-items: center;

                        &>div {
                            line-height: calc(0.27 * 66.67px);
                            margin: 0 calc(0.05 * 66.67px);

                            &>p {
                                margin: 0;
                            }

                            &>p:first-child {
                                color: #000;
                                font-size: calc(0.16 * 66.67px);
                            }

                            &>p:last-child {
                                font-size: calc(0.12 * 66.67px);
                                color: #666;
                                width: 100px;
                                white-space: nowrap;
                                overflow: hidden;
                                text-overflow: ellipsis;
                            }
                        }
                    }

                    .item_time {
                        height: 100%;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-around;
                        align-items: flex-end;
                        line-height: calc(0.26 * 66.67px);
                        font-size: calc(0.12 * 66.67px);
                        color: #666;

                        p {
                            margin: 0;
                            white-space: nowrap;
                        }

                        &>img {
                            width: 18px;
                            height: 18px;
                        }
                    }
                }
            }
        }

        .chat_right {
            width: 80%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-direction: column;

            .chat_info_head {
                width: 100%;
                height: 40px;
                background-color: #EBEDF2;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: calc(0.1 * 66.67px);

                .ch_info {
                    display: flex;
                    align-items: center;

                    p {
                        margin: 0 3px;
                        font-weight: 600;
                        font-size: 14px;
                    }

                    &>div {
                        margin: 0 calc(0.08 * 66.67px);
                        line-height: calc(0.26 * 66.67px);

                        &>p:last-child {
                            color: #666666;
                        }
                    }
                }

                .icon_fun {
                    background-color: #fff;
                    padding: calc(0.1 * 66.67px);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;

                    &>img {
                        width: calc(0.22 * 66.67px);
                        height: calc(0.22 * 66.67px);
                        margin: 0 calc(0.1 * 66.67px);
                        cursor: pointer;
                    }
                }
            }

            .chat_main {
                width: 100%;
                height: 95%;
                background-color: #fff;
                display: flex;
                align-items: center;
                flex-direction: column;
                justify-content: center;

                .MessageBox {
                    width: 100%;
                    height: 75%;
                    position: relative;
                    overflow: auto;
                    margin: 2px 0;

                    &::-webkit-scrollbar {
                        width: 6px;
                    }

                    // 滚动条轨道
                    &::-webkit-scrollbar-track {
                        background: rgb(239, 239, 239);
                        border-radius: 2px;
                    }

                    // 小滑块
                    &::-webkit-scrollbar-thumb {
                        background: #2d2d2e49;
                        border-radius: 10px;
                    }

                    &::-webkit-scrollbar-thumb:hover {
                        background: #6b6b6b49;
                    }

                    .chatImage,
                    p {
                        margin: 0 8px;

                    }

                    .roleA {
                        margin: 36px 5px 20px;

                        &>div {
                            display: flex;
                            align-items: center;
                            position: relative;

                            .newChatBox {
                                display: flex;
                                flex-direction: column;
                                align-items: flex-start;
                                position: relative;

                                .chat_text {
                                    max-width: 300px;
                                    border-radius: 10px 10px 10px 0px;
                                    background: #F2F3F7;
                                    padding: calc(0.1 * 66.67px);
                                    word-wrap: break-word;
                                    line-height: calc(0.23 * 66.67px);
                                    white-space: pre-wrap;
                                    color: #080808;
                                }

                                .chat_translate {
                                    font-size: calc(0.13 * 66.67px);
                                    color: #666;
                                    max-width: 300px;
                                    word-wrap: break-word;
                                    line-height: calc(0.23 * 66.67px);
                                    white-space: pre-wrap;
                                }

                                .chat_time {
                                    font-size: calc(0.12 * 66.67px);
                                    color: #666;
                                }
                            }
                        }
                    }

                    .roleB {
                        margin: 36px 5px 20px;

                        &>div {
                            display: flex;
                            flex-direction: row-reverse;
                            align-items: center;
                            position: relative;


                        }
                    }
                }

                .chat_frame {
                    width: 100%;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    padding: 10px calc(0.08 * 66.67px) 0;
                    border-top: 1px solid #eee;

                    .chat_fun {
                        position: absolute;
                        left: 20px;
                        bottom: 10px;

                        i {
                            margin: 0 5px;
                            font-size: 18px;
                            cursor: pointer;

                            &:hover {
                                opacity: 0.7;
                            }
                        }
                    }

                    .sendMessage {
                        max-width: 100px;
                        position: absolute;
                        right: 20px;
                        bottom: 10px;
                        border-radius: 12px;
                    }
                }
            }
        }
    }

    .contactInfo {
        width: 15%;
        height: 97%;
        background-color: #EBEDF2;
        border-radius: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: calc(0.2 * 66.67px) 12px;

        .userinfo {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-around;
            padding: 0 0 15px 0;
            border-bottom: 1px solid #999;
        }

        .nomarke {
            width: 120px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 12px;

            p {
                margin: 0;
            }

            &>p:first-child {
                font-weight: bold;
                color: var(--el-text-color-primary);
            }

            .remark {
                display: flex;
                align-items: center;

                p {
                    font-size: 13px;
                }

                img {
                    cursor: pointer;
                    margin: 0 0 0 3px;

                    &:hover {
                        opacity: 0.8;
                    }
                }

                input {
                    width: calc(1.2 * 66.67px);
                    height: 20px;
                    border: none;
                    border-radius: 5px;
                    outline: none;
                    padding: 0 calc(0.1 * 66.67px);

                    &::placeholder {
                        color: #666;
                        font-size: calc(0.13 * 66.67px);
                        padding: calc(0.03 * 66.67px);
                    }
                }
            }
        }
    }
}

:deep(.el-input__wrapper) {
    background: #DDE4F3;
    border-radius: 10px;
}

.popover_custom {
    &>ul {
        margin: 0;
    }

    &>ul>li {
        width: 100%;
        height: calc(0.4 * 66.67px);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #666666;
        border-radius: calc(0.08 * 66.67px);

        &:hover {
            background-color: #EBEDF2;
            color: #000;
        }
    }


}

:deep(.el-textarea__inner) {
    box-shadow: none;
    resize: none;
    border: 1px solid #666;
    border-radius: 20px;
}

.flex {
    width: 100%;
    margin: 10px 0;
    display: flex;
    align-items: center;
}

.quick_window {
    width: 100%;
    position: relative;

    :deep(.el-input__wrapper) {
        background: #fff;
        border-radius: 5px;
    }
}

.quick_text {
    padding: 5px 0 50px;
    height: 200px;
    overflow: auto;
}

.img_list {
    width: 100%;
    padding: 10px 0 50px;
    display: grid;
    grid-column-gap: 6px;
    /*列间距*/
    grid-row-gap: 10px;
    /*行间距*/
    grid-template-columns: repeat(4, 1fr);
    /*列数*/
}

.img_item {
    width: 90%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin: 10px auto;
    cursor: pointer;



    .imgBackg {
        width: 100%;
        height: 125.09px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #F2F2F2;
        position: relative;
        padding: 15px 0;
        border-radius: 10px;

        &:hover {
            opacity: 0.8;
        }
    }



    img {
        max-width: 100%;
        max-height: 100%;
        background-color: #fff;
    }

    p {
        margin: 5px 0;
    }
}

.checkBox {
    border: 2px solid #4162FF;
    overflow: hidden;
    border-radius: 10px;
}

.op_buttton {
    width: 100%;
    height: 40px;
    padding: 6px 10px;
    display: flex;
    justify-content: flex-end;
    border-radius: 0px 0px 20px 20px;
    background: rgba(255, 255, 255, 0.80);
    box-shadow: 0px -4px 4px 0px rgba(0, 0, 0, 0.05);
    backdrop-filter: blur(2px);
}

.upLoadModel {
    margin: 10px 0;
}

.input_a {
    margin: 15px 0;

    :deep(.el-input__wrapper) {
        background: #fff;
        border-radius: 5px;
    }
}

.listGroup {
    width: 100%;
    height: 50px;
    cursor: pointer;
    display: flex;
    align-items: center;
    font-size: 13px;

    &:hover {
        opacity: 0.8;
    }

    p {
        margin: 0 0 0 10px;
        color: #000;
    }
}

.listGroup_ac {
    width: 100%;
    height: 50px;
    border-radius: 10px;
    background-color: #4162FF;
    color: #fff;
    overflow: hidden;
    cursor: pointer;
    display: flex;
    align-items: center;
    font-size: 13px;


    p {
        margin: 0 0 0 10px;
        color: #fff;
    }
}

.chatImage {
    max-width: 300px;
    border-radius: 10px;
    box-shadow: 0px 1px 10px #ddd;
    cursor: pointer;
    margin: 3px 8px !important;
}

.shade {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9;
    background-color: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;

    .shade_content {
        background-color: #fff;
        border-radius: 8px;
        position: relative;
        padding: 30px 10px 10px;

        i {
            cursor: pointer;
            font-size: 22px;
            position: absolute;
            top: 3px;
            right: 3px;
            z-index: 11;
            border-radius: 50%;

            &:hover {
                opacity: 0.8;
            }
        }

        img {
            max-width: 600px;
        }
    }
}

.special {
    width: 100%;
    flex-direction: column !important;

    p {
        background: none !important;
        color: #777 !important;
        font-size: 12px !important;
        margin: 3px 0 !important;
    }
}

.moreText {
    text-align: center;
    color: #777;
    font-size: 12px;
    cursor: pointer;
}

.audio_list {
    height: 220px;
    overflow: auto;
    padding: 15px 0 5px;
}

.audioBox {
    width: 200px;
    height: 60px;
    word-wrap: break-word;
    word-break: break-all;
    border-radius: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 0 5px;
    position: relative;
    background-color: var(--el-bg-color-page);
    color: var(--el-text-color-primary);
    margin: 0 8px;

    p {
        width: 120px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 13px;
    }

    .trapezoid {
        width: 80px;
        height: 0;
        border-bottom: 20px solid #F5F7FD;
        border-right: 30px solid transparent;
        border-radius: 10px 0 0;
        position: absolute;
        top: -13px;
        left: 0;
        z-index: 2;
    }

}

.ele_button {
    border: 1px solid #000;
    color: #000;
}

.quick2 {
    width: 100%;
    height: 100%;

    .quickTabs {
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: space-around;
        background-color: #d9d9d9;
        margin: 25px 0;
        border-radius: 8px;

        p {
            margin: 0;
            cursor: pointer;
            width: 33%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .item {
            color: var(--el-text-color-primary);
        }

        .active {
            height: 28px;
            border-radius: 8px;
            color: #fff;
            background: #4162FF;
        }
    }

    .text_quick {
        max-height: 500px;
        overflow: auto;

        .quicks_text {
            display: flex;
            padding: 12px 0px;
            align-items: flex-end;
            cursor: pointer;
            border-bottom: 1px solid #E6E6E6;
            border-radius: 8px;

            p {
                width: 180px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                margin: 0;
                font-size: 13px;
            }

            &:hover {
                background-color: #e4e6eb;
            }
        }
    }

    .img_quick {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        height: calc(100% - 74px);

        .img_quicks {
            display: grid;
            grid-column-gap: 6px;
            grid-row-gap: 10px;
            grid-template-columns: repeat(2, 1fr);
            max-height: 500px;
            overflow: auto;

            .quicks_img {
                width: 100%;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                cursor: pointer;

                p {
                    margin: 0;
                }

                .imgBackg {
                    width: 100%;
                    height: 70px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: #fff;
                    position: relative;
                    border-radius: 10px;

                    &:hover {
                        opacity: 0.8;
                    }
                }

                img {
                    max-width: 100%;
                    max-height: 100%;
                    background-color: #fff;
                }

                p {
                    margin: 5px 0;
                }
            }
        }


    }


    .audio_quicks {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        height: calc(100% - 74px);

        .quicks_audio {
            max-height: 500px;
            overflow: auto;
        }
    }


}

.quick_button {
    width: 100%;
    display: flex;
    flex-direction: column;

    button {
        width: 100%;
        margin: 5px 0;
    }
}

.rowFun {
    display: flex;
    align-items: center;
    justify-content: center;

    p {
        margin: 0 5px;
        cursor: pointer;

        &:hover {
            opacity: 0.8;
        }
    }

    &>p:last-child {
        color: #f56c6c;
    }
}

.rowInput {
    background-color: none;
    box-shadow: none;
    border: none
}

.serveSelect {
    width: 100%;
    min-width: 1300px;
    padding: calc(0.2 * 66.67px);
    overflow: auto;
    // background: url('@/assets/images/backg.png') no-repeat;
    background-size: cover;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: calc(0.16 * 66.67px);

    .ser_box {
        width: 500px;
        height: 300px;
        box-shadow: 0 0px 5px #9c9c9c;
        background-color: #fff;
        border-radius: 10px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        justify-content: space-around;
        position: relative;

        &>p:first-child {
            font-size: 22px;
            font-weight: bold;
            margin: 0;
        }
    }
}

:deep(.s_1 .el-input__wrapper) {
    background: none !important;
    border-radius: 3px
}

.chat_img {
    width: calc(0.34 * 66.67px);
}

.newChatBox {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    position: relative;

    .chat_text {
        max-width: 300px;
        border-radius: 10px 10px 0px 10px;
        background: #4162FF;
        padding: calc(0.1 * 66.67px);
        color: #fff;
        word-wrap: break-word;
        line-height: calc(0.23 * 66.67px);
        white-space: pre-wrap;
        margin: 3px 8px !important;
    }

    .chat_translate {
        font-size: calc(0.13 * 66.67px);
        color: #666;
        max-width: 300px;
        word-wrap: break-word;
        line-height: calc(0.23 * 66.67px);
        white-space: pre-wrap;
    }

    .chat_time {
        font-size: calc(0.12 * 66.67px);
        color: #666;
    }
}

.chart {
    width: 100%;
    height: 60%;
}
</style>
