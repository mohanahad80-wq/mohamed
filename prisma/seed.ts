import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function hash(pw: string) {
  return bcrypt.hash(pw, 10);
}

async function main() {
  const password = await hash("password123");

  // --- Admin ---
  await prisma.user.upsert({
    where: { phone: "+252610000001" },
    update: {},
    create: {
      phone: "+252610000001",
      email: "admin@mamasacdiya.com",
      passwordHash: password,
      fullName: "Admin",
      status: "APPROVED",
      roles: ["ADMIN"],
      adminScope: "FULL",
      phoneVerifiedAt: new Date(),
      emailVerifiedAt: new Date(),
    },
  });

  // --- Seller ---
  const sellerUser = await prisma.user.upsert({
    where: { phone: "+252610000002" },
    update: {},
    create: {
      phone: "+252610000002",
      email: "seller@mamasacdiya.com",
      passwordHash: password,
      fullName: "Xasan Cali",
      status: "APPROVED",
      roles: ["SELLER"],
      phoneVerifiedAt: new Date(),
      emailVerifiedAt: new Date(),
    },
  });
  const sellerProfile = await prisma.sellerProfile.upsert({
    where: { userId: sellerUser.id },
    update: {},
    create: {
      userId: sellerUser.id,
      businessName: "Hodan Wholesale Textiles",
      ownerFullName: "Xasan Cali",
      phone: sellerUser.phone,
      email: sellerUser.email!,
      category: "CLOTHING",
      district: "HODAN",
      city: "Mogadishu",
      payoutNumber: "252610000002",
      defaultMinOrderQty: 10,
      status: "APPROVED",
    },
  });

  const wholesaleProducts = await Promise.all(
    [
      { name: "Cotton T-Shirts (Bulk, 12 colors)", price: 3.5, stock: 500, minOrderQty: 20 },
      { name: "Men's Casual Shirts (Wholesale Carton)", price: 6.0, stock: 300, minOrderQty: 12 },
      { name: "Kids Shoes (Assorted Sizes, Carton)", price: 4.25, stock: 200, minOrderQty: 10 },
    ].map((p) =>
      prisma.product.create({
        data: {
          vendorType: "SELLER",
          sellerId: sellerProfile.id,
          name: p.name,
          description: `Wholesale ${p.name} — bulk pricing for registered Business Buyers.`,
          category: "CLOTHING",
          price: p.price,
          stock: p.stock,
          minOrderQty: p.minOrderQty,
          images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600"],
          status: "APPROVED",
        },
      })
    )
  );

  // --- Business Buyer ---
  const buyerUser = await prisma.user.upsert({
    where: { phone: "+252610000003" },
    update: {},
    create: {
      phone: "+252610000003",
      email: "buyer@mamasacdiya.com",
      passwordHash: password,
      fullName: "Faadumo Warsame",
      status: "APPROVED",
      roles: ["BUSINESS_BUYER"],
      phoneVerifiedAt: new Date(),
      emailVerifiedAt: new Date(),
    },
  });
  const buyerProfile = await prisma.businessBuyerProfile.upsert({
    where: { userId: buyerUser.id },
    update: {},
    create: {
      userId: buyerUser.id,
      businessName: "Faadumo Retail Corner",
      storeName: "Faadumo Retail Corner",
      ownerFullName: "Faadumo Warsame",
      phone: buyerUser.phone,
      email: buyerUser.email!,
      category: "CLOTHING",
      district: "WADAJIR",
      city: "Mogadishu",
      payoutNumber: "252610000003",
      status: "APPROVED",
    },
  });

  await Promise.all(
    [
      { name: "Cotton T-Shirt (Single, any color)", price: 6.5, stock: 80 },
      { name: "Men's Casual Shirt", price: 12.0, stock: 40 },
      { name: "Kids Shoes (Pair)", price: 9.0, stock: 60 },
    ].map((p) =>
      prisma.product.create({
        data: {
          vendorType: "BUSINESS_BUYER_STORE",
          buyerStoreId: buyerProfile.id,
          name: p.name,
          description: `Retail ${p.name}, sold individually in Mogadishu.`,
          category: "CLOTHING",
          price: p.price,
          stock: p.stock,
          minOrderQty: 1,
          images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600"],
          status: "APPROVED",
        },
      })
    )
  );

  // --- Customer ---
  const customerUser = await prisma.user.upsert({
    where: { phone: "+252610000004" },
    update: {},
    create: {
      phone: "+252610000004",
      passwordHash: password,
      fullName: "Cabdi Rooble",
      status: "APPROVED",
      roles: ["CUSTOMER"],
      phoneVerifiedAt: new Date(),
    },
  });
  await prisma.address.upsert({
    where: { id: "seed-customer-address" },
    update: {},
    create: {
      id: "seed-customer-address",
      userId: customerUser.id,
      label: "Home",
      district: "HAMAR_WEYNE",
      details: "Near Bakaara Market, house #12",
      isDefault: true,
    },
  });

  // --- Rider ---
  const riderUser = await prisma.user.upsert({
    where: { phone: "+252610000005" },
    update: {},
    create: {
      phone: "+252610000005",
      passwordHash: password,
      fullName: "Maxamed Rider",
      status: "APPROVED",
      roles: ["RIDER"],
      phoneVerifiedAt: new Date(),
    },
  });
  await prisma.riderProfile.upsert({
    where: { userId: riderUser.id },
    update: {},
    create: {
      userId: riderUser.id,
      fullName: "Maxamed Rider",
      phone: riderUser.phone,
      vehicleType: "Motorbike",
      plateNumber: "MOG-1234",
      serviceDistricts: ["HODAN", "WADAJIR", "HAMAR_WEYNE", "BONDHERE"],
      payoutNumber: "252610000005",
      status: "APPROVED",
      isOnline: true,
      maxLoad: 3,
    },
  });

  // --- A pending seller + pending rider, for admin approval demo ---
  const pendingSellerUser = await prisma.user.upsert({
    where: { phone: "+252610000006" },
    update: {},
    create: {
      phone: "+252610000006",
      email: "newseller@mamasacdiya.com",
      passwordHash: password,
      fullName: "Sahra Nuur",
      status: "PENDING",
      roles: ["SELLER"],
      phoneVerifiedAt: new Date(),
      emailVerifiedAt: new Date(),
    },
  });
  await prisma.sellerProfile.upsert({
    where: { userId: pendingSellerUser.id },
    update: {},
    create: {
      userId: pendingSellerUser.id,
      businessName: "Karaan Electronics Wholesale",
      ownerFullName: "Sahra Nuur",
      phone: pendingSellerUser.phone,
      email: pendingSellerUser.email!,
      category: "ELECTRONICS",
      district: "KARAAN",
      city: "Mogadishu",
      payoutNumber: "252610000006",
      status: "PENDING",
    },
  });

  console.log("Seeded:");
  console.log("  Admin:          +252610000001 / password123");
  console.log("  Seller:         +252610000002 / password123");
  console.log("  Business Buyer: +252610000003 / password123");
  console.log("  Customer:       +252610000004 / password123");
  console.log("  Rider:          +252610000005 / password123");
  console.log("  Pending Seller: +252610000006 / password123");
  console.log(`  ${wholesaleProducts.length} wholesale products, 3 retail products created.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
