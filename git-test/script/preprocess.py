import os
import csv
from datetime import datetime
from typing import List

# 配置输入和输出路径
INPUT_DIR = "../data/水质数据/water_quality_by_name"
OUTPUT_FILE = "../data/processed/combined_water_quality.csv"

# 定义 CSV 列名
CSV_HEADERS = [
    "省份",
    "流域",
    "断面名称",
    "监测时间",
    "水质类别",
    "水温",
    "pH",
    "溶解氧",
    "电导率",
    "浊度",
    "高锰酸盐指数",
    "氨氮",
    "总磷",
    "总氮",
    "叶绿素",
    "藻密度",
    "站点情况",
]


def process_date(raw_date: str, year_month: str) -> str:
    """处理监测时间格式，将 '04-01 08:00' 转换为完整的 'YYYY-MM-DD HH:MM:SS'"""
    try:
        # 从目录结构中提取年份和月份
        year = int(year_month.split("-")[0])
        month = int(year_month.split("-")[1])

        # 解析原始日期时间
        month_day, time = raw_date.split()
        day = int(month_day.split("-")[1])
        hour, minute = map(int, time.split(":"))

        # 创建 datetime 对象并格式化
        dt = datetime(year, month, day, hour, minute)
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    except (ValueError, AttributeError):
        return "null"


def clean_value(value: str) -> str:
    """清理数据值，处理缺失值"""
    value = str(value).strip()
    if value in ["*", "--", "", "NA", "N/A", "NaN", "None"]:
        return "null"
    return value


def process_csv_file(filepath: str, year_month: str) -> List[List[str]]:
    """处理单个 CSV 文件"""
    data = []
    with open(filepath, mode="r", encoding="utf-8") as f:
        reader = csv.reader(f)
        next(reader)  # 跳过标题行

        for row in reader:
            if len(row) != len(CSV_HEADERS):
                continue  # 跳过格式不正确的行

            processed_row = list(row)  # 复制原始行

            # 处理监测时间
            processed_row[3] = process_date(row[3], year_month)

            # 清理所有值
            for i in range(len(processed_row)):
                processed_row[i] = clean_value(processed_row[i])

            data.append(processed_row)

    return data


def find_and_process_csv_files() -> List[List[str]]:
    """递归查找并处理所有 CSV 文件"""
    all_data = []

    # 遍历省份目录
    for province in os.listdir(INPUT_DIR):
        province_path = os.path.join(INPUT_DIR, province)
        if not os.path.isdir(province_path):
            continue

        # 遍历流域目录
        for basin in os.listdir(province_path):
            basin_path = os.path.join(province_path, basin)
            if not os.path.isdir(basin_path):
                continue

            # 遍历断面目录
            for site in os.listdir(basin_path):
                site_path = os.path.join(basin_path, site)
                if not os.path.isdir(site_path):
                    continue

                # 遍历年月目录
                for year_month in os.listdir(site_path):
                    year_month_path = os.path.join(site_path, year_month)
                    if not os.path.isdir(year_month_path):
                        continue

                    # 处理该目录下的 CSV 文件
                    for filename in os.listdir(year_month_path):
                        if not filename.endswith(".csv"):
                            continue

                        csv_path = os.path.join(year_month_path, filename)
                        try:
                            data = process_csv_file(csv_path, year_month)
                            all_data.extend(data)
                            print(f"Processed: {csv_path}")
                        except Exception as e:
                            print(f"Error processing {csv_path}: {str(e)}")

    return all_data


def write_combined_csv(data: List[List[str]]):
    """将合并的数据写入输出文件"""
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

    with open(OUTPUT_FILE, mode="w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(CSV_HEADERS)
        writer.writerows(data)

    print(f"\nSuccessfully wrote combined data to {OUTPUT_FILE}")
    print(f"Total records processed: {len(data)}")


def main():
    print("Starting data processing...")
    combined_data = find_and_process_csv_files()
    write_combined_csv(combined_data)


if __name__ == "__main__":
    main()
