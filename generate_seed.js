const fs = require('fs');

const managerId = '4cfe2840-ba34-4ece-a0ea-a7952e569751';

const categories = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Hot Beverages', color: '#ef4444' }, // red
  { id: '22222222-2222-2222-2222-222222222222', name: 'Cold Beverages', color: '#3b82f6' }, // blue
  { id: '33333333-3333-3333-3333-333333333333', name: 'Pastries & Bakery', color: '#f59e0b' }, // yellow
  { id: '44444444-4444-4444-4444-444444444444', name: 'Breakfast', color: '#10b981' }, // green
  { id: '55555555-5555-5555-5555-555555555555', name: 'Sandwiches & Wraps', color: '#8b5cf6' }, // purple
  { id: '66666666-6666-6666-6666-666666666666', name: 'Salads & Bowls', color: '#14b8a6' }, // teal
  { id: '77777777-7777-7777-7777-777777777777', name: 'Desserts', color: '#ec4899' }, // pink
];

let products = [];
let imgCounter = 1;

function addProducts(catId, items) {
  for (const item of items) {
    products.push({
      category_id: catId,
      name: item.name,
      price: item.price,
      tax: item.tax || 5,
      description: item.description,
      image_url: `https://loremflickr.com/400/400/${item.keyword}?random=${imgCounter++}`
    });
  }
}

// 1. Hot Beverages (approx 25)
addProducts('11111111-1111-1111-1111-111111111111', [
  { name: 'Espresso', price: 120, description: 'Classic strong Italian espresso', keyword: 'espresso' },
  { name: 'Double Espresso', price: 160, description: 'Double shot of espresso', keyword: 'espresso' },
  { name: 'Americano', price: 150, description: 'Espresso with hot water', keyword: 'coffee' },
  { name: 'Cappuccino', price: 180, description: 'Espresso with steamed milk and foam', keyword: 'cappuccino' },
  { name: 'Latte', price: 190, description: 'Espresso with lots of steamed milk', keyword: 'latte' },
  { name: 'Mocha', price: 210, description: 'Espresso with chocolate and steamed milk', keyword: 'mocha' },
  { name: 'Flat White', price: 200, description: 'Smooth microfoamed milk over espresso', keyword: 'coffee' },
  { name: 'Macchiato', price: 160, description: 'Espresso marked with milk foam', keyword: 'macchiato' },
  { name: 'Cortado', price: 170, description: 'Equal parts espresso and steamed milk', keyword: 'cortado' },
  { name: 'Hot Chocolate', price: 180, description: 'Rich, creamy hot chocolate', keyword: 'hot-chocolate' },
  { name: 'Chai Latte', price: 190, description: 'Spiced tea with steamed milk', keyword: 'tea' },
  { name: 'Matcha Latte', price: 220, description: 'Green tea matcha with steamed milk', keyword: 'matcha' },
  { name: 'English Breakfast Tea', price: 120, description: 'Strong black tea', keyword: 'tea' },
  { name: 'Earl Grey Tea', price: 120, description: 'Black tea with bergamot', keyword: 'tea' },
  { name: 'Green Tea', price: 120, description: 'Healthy green tea leaves', keyword: 'green-tea' },
  { name: 'Peppermint Tea', price: 110, description: 'Refreshing mint tea', keyword: 'tea' },
  { name: 'Chamomile Tea', price: 110, description: 'Calming herbal tea', keyword: 'tea' },
  { name: 'Oolong Tea', price: 130, description: 'Traditional Chinese tea', keyword: 'tea' },
  { name: 'White Tea', price: 140, description: 'Delicate white tea', keyword: 'tea' },
  { name: 'Affogato', price: 250, description: 'Espresso poured over vanilla ice cream', keyword: 'affogato' },
  { name: 'Irish Coffee', price: 280, description: 'Coffee with Irish whiskey and cream', keyword: 'irish-coffee' },
  { name: 'Cafe au Lait', price: 180, description: 'Coffee with hot milk added', keyword: 'coffee' }
]);

// 2. Cold Beverages (approx 30)
addProducts('22222222-2222-2222-2222-222222222222', [
  { name: 'Iced Coffee', price: 160, description: 'Cold brewed iced coffee', keyword: 'iced-coffee' },
  { name: 'Iced Latte', price: 200, description: 'Espresso over ice with milk', keyword: 'iced-latte' },
  { name: 'Iced Mocha', price: 220, description: 'Espresso, chocolate, and milk over ice', keyword: 'mocha' },
  { name: 'Cold Brew', price: 190, description: 'Slow steeped cold coffee', keyword: 'cold-brew' },
  { name: 'Nitro Cold Brew', price: 240, description: 'Nitrogen-infused cold brew', keyword: 'coffee' },
  { name: 'Frappuccino', price: 250, description: 'Blended iced coffee drink', keyword: 'frappuccino' },
  { name: 'Vanilla Frappe', price: 260, description: 'Vanilla blended iced drink', keyword: 'frappe' },
  { name: 'Caramel Frappe', price: 260, description: 'Caramel blended iced drink', keyword: 'frappe' },
  { name: 'Mocha Frappe', price: 270, description: 'Chocolate blended iced coffee', keyword: 'frappe' },
  { name: 'Iced Tea', price: 120, description: 'Classic sweetened iced tea', keyword: 'iced-tea' },
  { name: 'Peach Iced Tea', price: 140, description: 'Iced tea with peach flavor', keyword: 'iced-tea' },
  { name: 'Lemon Iced Tea', price: 140, description: 'Iced tea with lemon squeeze', keyword: 'iced-tea' },
  { name: 'Lemonade', price: 110, description: 'Freshly squeezed lemonade', keyword: 'lemonade' },
  { name: 'Strawberry Lemonade', price: 150, description: 'Lemonade mixed with strawberries', keyword: 'lemonade' },
  { name: 'Mango Smoothie', price: 200, description: 'Fresh mango blended with yogurt', keyword: 'smoothie' },
  { name: 'Berry Smoothie', price: 210, description: 'Mixed berries blended smooth', keyword: 'smoothie' },
  { name: 'Green Smoothie', price: 220, description: 'Healthy kale and spinach smoothie', keyword: 'smoothie' },
  { name: 'Protein Shake', price: 250, description: 'Whey protein blended with milk', keyword: 'shake' },
  { name: 'Orange Juice', price: 150, description: 'Fresh squeezed orange juice', keyword: 'juice' },
  { name: 'Apple Juice', price: 140, description: 'Fresh apple juice', keyword: 'juice' },
  { name: 'Pineapple Juice', price: 150, description: 'Fresh pineapple juice', keyword: 'juice' },
  { name: 'Cranberry Juice', price: 160, description: 'Cranberry juice', keyword: 'juice' },
  { name: 'Sparkling Water', price: 100, description: 'Carbonated water', keyword: 'water' },
  { name: 'Still Water', price: 50, description: 'Bottled mineral water', keyword: 'water' },
  { name: 'Cola', price: 60, description: 'Classic cola soda', keyword: 'soda' },
  { name: 'Lemon Lime Soda', price: 60, description: 'Lemon lime flavored soda', keyword: 'soda' },
  { name: 'Ginger Ale', price: 70, description: 'Ginger flavored soda', keyword: 'soda' },
  { name: 'Root Beer', price: 70, description: 'Classic root beer', keyword: 'soda' },
  { name: 'Kombucha', price: 200, description: 'Fermented tea drink', keyword: 'drink' }
]);

// 3. Pastries & Bakery (approx 25)
addProducts('33333333-3333-3333-3333-333333333333', [
  { name: 'Butter Croissant', price: 120, description: 'Flaky, buttery croissant', keyword: 'croissant' },
  { name: 'Chocolate Croissant', price: 150, description: 'Croissant filled with dark chocolate', keyword: 'croissant' },
  { name: 'Almond Croissant', price: 160, description: 'Croissant topped with almonds', keyword: 'croissant' },
  { name: 'Blueberry Muffin', price: 100, description: 'Soft muffin with fresh blueberries', keyword: 'muffin' },
  { name: 'Chocolate Chip Muffin', price: 110, description: 'Muffin loaded with chocolate chips', keyword: 'muffin' },
  { name: 'Banana Nut Muffin', price: 110, description: 'Banana muffin with walnuts', keyword: 'muffin' },
  { name: 'Bran Muffin', price: 90, description: 'Healthy bran muffin', keyword: 'muffin' },
  { name: 'Cinnamon Roll', price: 160, description: 'Warm cinnamon roll with icing', keyword: 'pastry' },
  { name: 'Pecan Sticky Bun', price: 180, description: 'Sticky bun loaded with pecans', keyword: 'pastry' },
  { name: 'Apple Turnover', price: 140, description: 'Flaky pastry filled with spiced apples', keyword: 'pastry' },
  { name: 'Cherry Danish', price: 130, description: 'Danish pastry with cherry filling', keyword: 'pastry' },
  { name: 'Cheese Danish', price: 130, description: 'Danish pastry with sweet cream cheese', keyword: 'pastry' },
  { name: 'Plain Bagel', price: 80, description: 'Classic New York style bagel', keyword: 'bagel' },
  { name: 'Everything Bagel', price: 90, description: 'Bagel topped with seeds and garlic', keyword: 'bagel' },
  { name: 'Sesame Bagel', price: 90, description: 'Bagel topped with sesame seeds', keyword: 'bagel' },
  { name: 'Cinnamon Raisin Bagel', price: 100, description: 'Sweet bagel with cinnamon and raisins', keyword: 'bagel' },
  { name: 'Scone', price: 110, description: 'Traditional butter scone', keyword: 'pastry' },
  { name: 'Blueberry Scone', price: 120, description: 'Scone with wild blueberries', keyword: 'pastry' },
  { name: 'Baguette', price: 150, description: 'Fresh French baguette', keyword: 'bread' },
  { name: 'Sourdough Loaf', price: 250, description: 'Artisan sourdough bread loaf', keyword: 'bread' },
  { name: 'Pretzel', price: 120, description: 'Soft, salty baked pretzel', keyword: 'pastry' },
  { name: 'Eclair', price: 160, description: 'Choux pastry filled with cream', keyword: 'pastry' },
  { name: 'Macaron', price: 80, description: 'Delicate French macaron cookie', keyword: 'pastry' }
]);

// 4. Breakfast (approx 20)
addProducts('44444444-4444-4444-4444-444444444444', [
  { name: 'Avocado Toast', price: 250, description: 'Smashed avocado on sourdough toast', keyword: 'toast' },
  { name: 'Eggs Benedict', price: 300, description: 'Poached eggs on muffin with hollandaise', keyword: 'eggs' },
  { name: 'Pancakes', price: 220, description: 'Stack of fluffy buttermilk pancakes', keyword: 'pancakes' },
  { name: 'Waffles', price: 240, description: 'Crispy Belgian waffles', keyword: 'waffles' },
  { name: 'French Toast', price: 230, description: 'Thick slices of french toast', keyword: 'toast' },
  { name: 'Oatmeal', price: 150, description: 'Warm oatmeal with berries and honey', keyword: 'oatmeal' },
  { name: 'Granola Parfait', price: 180, description: 'Yogurt layered with granola and fruit', keyword: 'parfait' },
  { name: 'Fruit Bowl', price: 160, description: 'Bowl of fresh seasonal fruits', keyword: 'fruit' },
  { name: 'Breakfast Burrito', price: 260, description: 'Eggs, cheese, and bacon wrapped in tortilla', keyword: 'burrito' },
  { name: 'Breakfast Sandwich', price: 220, description: 'Egg and cheese on a toasted bun', keyword: 'sandwich' },
  { name: 'Omelette', price: 240, description: 'Three egg omelette with cheese and herbs', keyword: 'omelette' },
  { name: 'Hash Browns', price: 120, description: 'Crispy golden potato hash browns', keyword: 'potatoes' },
  { name: 'Bacon Side', price: 140, description: 'Side of crispy bacon strips', keyword: 'bacon' },
  { name: 'Sausage Links', price: 140, description: 'Side of breakfast sausage links', keyword: 'sausage' },
  { name: 'Scrambled Eggs', price: 150, description: 'Soft scrambled eggs', keyword: 'eggs' },
  { name: 'Bagel with Lox', price: 280, description: 'Bagel with smoked salmon and cream cheese', keyword: 'bagel' },
  { name: 'Shakshuka', price: 320, description: 'Eggs poached in a sauce of tomatoes and peppers', keyword: 'shakshuka' }
]);

// 5. Sandwiches & Wraps (approx 20)
addProducts('55555555-5555-5555-5555-555555555555', [
  { name: 'Turkey Club', price: 350, description: 'Triple decker sandwich with turkey and bacon', keyword: 'sandwich' },
  { name: 'BLT', price: 280, description: 'Bacon, lettuce, and tomato sandwich', keyword: 'sandwich' },
  { name: 'Grilled Cheese', price: 200, description: 'Melted cheddar on grilled sourdough', keyword: 'sandwich' },
  { name: 'Tuna Salad Sandwich', price: 250, description: 'Fresh tuna salad on whole wheat', keyword: 'sandwich' },
  { name: 'Chicken Salad Sandwich', price: 260, description: 'Creamy chicken salad on brioche', keyword: 'sandwich' },
  { name: 'Veggie Wrap', price: 240, description: 'Hummus and fresh vegetables wrapped in tortilla', keyword: 'wrap' },
  { name: 'Chicken Caesar Wrap', price: 280, description: 'Grilled chicken with romaine and caesar dressing', keyword: 'wrap' },
  { name: 'Philly Cheesesteak', price: 380, description: 'Steak and melted cheese on a hoagie roll', keyword: 'sandwich' },
  { name: 'Reuben Sandwich', price: 350, description: 'Corned beef, swiss cheese, and sauerkraut', keyword: 'sandwich' },
  { name: 'Cuban Sandwich', price: 340, description: 'Roasted pork, ham, swiss, and pickles', keyword: 'sandwich' },
  { name: 'Caprese Sandwich', price: 290, description: 'Fresh mozzarella, tomato, and pesto', keyword: 'sandwich' },
  { name: 'Italian Sub', price: 360, description: 'Salami, pepperoni, ham, and provolone', keyword: 'sandwich' },
  { name: 'Pulled Pork Sandwich', price: 320, description: 'BBQ pulled pork on a soft bun', keyword: 'sandwich' },
  { name: 'Meatball Sub', price: 340, description: 'Meatballs in marinara sauce with cheese', keyword: 'sandwich' },
  { name: 'Falafel Wrap', price: 260, description: 'Crispy falafel with tahini and veggies', keyword: 'wrap' },
  { name: 'Egg Salad Sandwich', price: 220, description: 'Classic egg salad on white bread', keyword: 'sandwich' },
  { name: 'Roast Beef Sandwich', price: 350, description: 'Thinly sliced roast beef with horseradish', keyword: 'sandwich' }
]);

// 6. Salads & Bowls (approx 15)
addProducts('66666666-6666-6666-6666-666666666666', [
  { name: 'Caesar Salad', price: 260, description: 'Romaine, croutons, and parmesan', keyword: 'salad' },
  { name: 'Greek Salad', price: 280, description: 'Cucumbers, tomatoes, olives, and feta', keyword: 'salad' },
  { name: 'Cobb Salad', price: 320, description: 'Mixed greens with bacon, egg, and blue cheese', keyword: 'salad' },
  { name: 'Spinach Salad', price: 270, description: 'Baby spinach with strawberries and pecans', keyword: 'salad' },
  { name: 'Quinoa Bowl', price: 340, description: 'Quinoa with roasted vegetables and tahini', keyword: 'bowl' },
  { name: 'Teriyaki Chicken Bowl', price: 360, description: 'Grilled chicken and rice with teriyaki sauce', keyword: 'bowl' },
  { name: 'Poke Bowl', price: 420, description: 'Fresh tuna with rice and seaweed', keyword: 'bowl' },
  { name: 'Buddha Bowl', price: 350, description: 'Healthy mix of grains, greens, and beans', keyword: 'bowl' },
  { name: 'Caprese Salad', price: 290, description: 'Sliced tomatoes, mozzarella, and basil', keyword: 'salad' },
  { name: 'Waldorf Salad', price: 280, description: 'Apples, walnuts, and celery with mayo', keyword: 'salad' },
  { name: 'Nicoise Salad', price: 340, description: 'Tuna, potatoes, green beans, and eggs', keyword: 'salad' },
  { name: 'Burrito Bowl', price: 330, description: 'Rice, beans, salsa, and guacamole', keyword: 'bowl' },
  { name: 'Acai Bowl', price: 300, description: 'Acai puree topped with granola and fruit', keyword: 'bowl' }
]);

// 7. Desserts (approx 20)
addProducts('77777777-7777-7777-7777-777777777777', [
  { name: 'Cheesecake', price: 220, description: 'Classic New York style cheesecake', keyword: 'cheesecake' },
  { name: 'Chocolate Cake', price: 240, description: 'Rich chocolate layer cake', keyword: 'cake' },
  { name: 'Carrot Cake', price: 230, description: 'Moist carrot cake with cream cheese frosting', keyword: 'cake' },
  { name: 'Tiramisu', price: 260, description: 'Italian coffee-flavored dessert', keyword: 'tiramisu' },
  { name: 'Brownie', price: 140, description: 'Fudgy chocolate brownie', keyword: 'brownie' },
  { name: 'Chocolate Chip Cookie', price: 80, description: 'Large freshly baked cookie', keyword: 'cookie' },
  { name: 'Oatmeal Raisin Cookie', price: 80, description: 'Chewy oatmeal cookie', keyword: 'cookie' },
  { name: 'Lemon Tart', price: 190, description: 'Tart lemon filling in a pastry shell', keyword: 'tart' },
  { name: 'Fruit Tart', price: 210, description: 'Custard filled tart topped with fresh fruit', keyword: 'tart' },
  { name: 'Apple Pie', price: 180, description: 'Classic baked apple pie slice', keyword: 'pie' },
  { name: 'Pecan Pie', price: 200, description: 'Sweet and nutty pecan pie slice', keyword: 'pie' },
  { name: 'Ice Cream Scoop', price: 100, description: 'Single scoop of artisanal ice cream', keyword: 'ice-cream' },
  { name: 'Sundae', price: 220, description: 'Ice cream topped with syrup and nuts', keyword: 'sundae' },
  { name: 'Panna Cotta', price: 230, description: 'Italian cream dessert with berry coulis', keyword: 'dessert' },
  { name: 'Crème Brûlée', price: 250, description: 'Vanilla custard with caramelized sugar top', keyword: 'dessert' },
  { name: 'Churros', price: 160, description: 'Fried dough tossed in cinnamon sugar', keyword: 'churros' },
  { name: 'Donut', price: 90, description: 'Glazed ring donut', keyword: 'donut' }
]);

let sql = `-- Seed Categories (Updated Schema)
`;

categories.forEach(c => {
  sql += `INSERT INTO public.categories (id, name, color, manager_id, status) VALUES ('${c.id}', '${c.name}', '${c.color}', '${managerId}', 'enable');\n`;
});

sql += `\n-- Seed Products (Updated Schema)\n`;

products.forEach(p => {
  const desc = p.description ? `'${p.description.replace(/'/g, "''")}'` : 'NULL';
  sql += `INSERT INTO public.products (name, category_id, price, tax, description, image_url, is_available, manager_id, status) VALUES ('${p.name.replace(/'/g, "''")}', '${p.category_id}', ${p.price}, ${p.tax}, ${desc}, '${p.image_url}', true, '${managerId}', 'enable');\n`;
});

fs.writeFileSync('d:/odoo/cafe/seed_products.sql', sql);
console.log('Seed SQL generated successfully!');
