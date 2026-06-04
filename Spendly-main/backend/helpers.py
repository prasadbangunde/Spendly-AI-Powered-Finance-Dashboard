def auto_categorize(description: str) -> str:
    desc = description.lower()
    rules = {
        "Food & Dining":  ["zomato","swiggy","food","restaurant","cafe","pizza","burger","biryani",
                           "dominos","kfc","mcdonalds","starbucks","grocery","bigbasket","blinkit","zepto"],
        "Transport":      ["ola","uber","rapido","petrol","diesel","fuel","metro","bus","auto",
                           "rickshaw","irctc","railway","flight","indigo","spicejet","airport"],
        "Shopping":       ["amazon","flipkart","myntra","meesho","ajio","nykaa","dmart","reliance",
                           "mall","shop","store","market"],
        "Entertainment":  ["netflix","prime","hotstar","spotify","youtube","movie","bookmyshow",
                           "pvr","inox","gaming","steam"],
        "Utilities":      ["electricity","water","gas","internet","wifi","broadband","jio","airtel",
                           "bsnl","vodafone","vi","recharge","mobile","phone bill"],
        "Health":         ["pharmacy","medplus","apollo","doctor","hospital","clinic","medicine",
                           "gym","fitness","yoga","pharmeasy","1mg"],
        "Education":      ["udemy","coursera","youtube premium","books","coaching","fees","tuition",
                           "college","school","course"],
        "Rent":           ["rent","pg","hostel","accommodation","housing"],
        "Salary":         ["salary","ctc","payroll","stipend"],
        "Freelance":      ["freelance","project","client","invoice","payment received"],
        "Investments":    ["mutual fund","sip","zerodha","groww","upstox","stocks","shares","nps","ppf"],
    }
    for category, keywords in rules.items():
        if any(k in desc for k in keywords):
            return category
    return "Other"

def create_notification(conn, user_id: int, message: str, type: str = "info"):
    conn.execute(
        "INSERT INTO notifications (user_id, message, type) VALUES (?,?,?)",
        (user_id, message, type)
    )
    conn.commit()
