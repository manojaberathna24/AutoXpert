import sqlite3

def update_db():
    conn = sqlite3.connect('stores.db')
    c = conn.cursor()
    
    # 1. Clear old locations and add realistic ones across Districts
    c.execute('DELETE FROM shop_locations')
    
    locations = [
        # Colombo / Dehiwala
        ('L1', 'Colombo', 1, 'Duluck81 Auto Shop', '12 Sri Sunandarama Rd, Dehiwala', '0777740000', 'https://maps.app.goo.gl/grRy7ao6JpfyqqAa6', 6.8485, 79.8801),
        ('L1', 'Colombo', 2, 'Selinico Accident Repairs', '81 Templers Rd, Dehiwala', '0710331342', 'https://maps.app.goo.gl/P7WgLYUzqnLoAdVHA', 6.8421, 79.8856),
        ('L1', 'Colombo', 3, 'Genuine Motor Tech', '47C Hospital Rd, Dehiwala', '0112730734', 'https://maps.app.goo.gl/KFZ8aL9DaaPgx77B8', 6.8430, 79.8840),
        
        # Kandy
        ('L2', 'Kandy', 1, 'Kandy Auto Care', '150 William Gopallawa Mawatha, Kandy', '0812223334', 'https://maps.app.goo.gl/KandyLink1', 7.2906, 80.6337),
        ('L2', 'Kandy', 2, 'Hill Country Repairs', 'Peradeniya Rd, Kandy', '0812225555', 'https://maps.app.goo.gl/KandyLink2', 7.2711, 80.5982),
        
        # Galle
        ('L3', 'Galle', 1, 'Southern Express Motors', 'Matara Road, Galle', '0912224445', 'https://maps.app.goo.gl/GalleLink1', 6.0367, 80.2170),
        ('L3', 'Galle', 2, 'Coastline Body Work', 'Galle Fort Area', '0912226666', 'https://maps.app.goo.gl/GalleLink2', 6.0260, 80.2160),
        
        # Gampaha
        ('L4', 'Gampaha', 1, 'Mainline Auto Gampaha', 'Ja-Ela Road, Gampaha', '0332227777', 'https://maps.app.goo.gl/GampahaLink1', 7.0873, 79.9925),
        ('L4', 'Gampaha', 2, 'Urban Repair Hub', 'Yakkala Rd, Gampaha', '0332228888', 'https://maps.app.goo.gl/GampahaLink2', 7.0910, 80.0100),
    ]
    
    c.executemany('''INSERT INTO shop_locations 
                     (location_id, location_name, rank, shop_name, address, phone, mapslink, latitude, longitude) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''', locations)

    # 2. Simulate some feedback for all added shops
    c.execute('DELETE FROM shop_feedback')
    shops_names = [loc[3] for loc in locations]
    for name in shops_names:
        c.execute('INSERT INTO shop_feedback VALUES (?, ?)', (name, 'positive'))
        c.execute('INSERT INTO shop_feedback VALUES (?, ?)', (name, 'positive'))
        if 'Auto' in name:
             c.execute('INSERT INTO shop_feedback VALUES (?, ?)', (name, 'positive'))
        else:
             c.execute('INSERT INTO shop_feedback VALUES (?, ?)', (name, 'negative'))

    conn.commit()
    conn.close()
    print("Database updated with various districts and realistic coordinates.")

if __name__ == "__main__":
    update_db()
