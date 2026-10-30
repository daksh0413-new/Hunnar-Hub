package com.hunnarhouse.logistics;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Hunnar House Atelier - Unified Delivery & Real-Time Logistics Backend
 * Provides order validation, storage, synchronization, and admin orchestration.
 */
@SpringBootApplication
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
        System.out.println("==========================================================");
        System.out.println(" Hunnar House Dispatch Engine Running at http://localhost:8080");
        System.out.println(" Leaflet Address Engine & Admin Sync API Active");
        System.out.println("==========================================================");
    }
}

// =========================================================================
// ORDER DATA MODELS & ENUMERATIONS
// =========================================================================

enum OrderStatus {
    RECEIVED,
    PREPARING,
    OUT_FOR_DELIVERY,
    DELIVERED,
    CANCELLED
}

class OrderItemRecord implements Serializable {
    private static final long serialVersionUID = 1L;
    private String itemName;
    private double unitPrice;

    public OrderItemRecord() {}

    public OrderItemRecord(String itemName, double unitPrice) {
        this.itemName = itemName;
        this.unitPrice = unitPrice;
    }

    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public double getUnitPrice() { return unitPrice; }
    public void setUnitPrice(double unitPrice) { this.unitPrice = unitPrice; }
}

class OrderEntity implements Serializable {
    private static final long serialVersionUID = 1L;

    private String orderId;
    private String customerName;
    private String customerPhone;
    private String deliveryAddress;
    private double latitude;
    private double longitude;
    private List<String> items = new ArrayList<>();
    private double totalAmount;
    private OrderStatus status;
    private String timestamp;

    public OrderEntity() {
        this.status = OrderStatus.RECEIVED;
        this.timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("hh:mm:ss a, dd MMM yyyy"));
    }

    public OrderEntity(String orderId, String customerName, String customerPhone, 
                       String deliveryAddress, double latitude, double longitude, 
                       List<String> items, double totalAmount) {
        this.orderId = orderId;
        this.customerName = customerName;
        this.customerPhone = customerPhone;
        this.deliveryAddress = deliveryAddress;
        this.latitude = latitude;
        this.longitude = longitude;
        this.items = items;
        this.totalAmount = totalAmount;
        this.status = OrderStatus.RECEIVED;
        this.timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("hh:mm:ss a, dd MMM yyyy"));
    }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }

    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }

    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }

    public List<String> getItems() { return items; }
    public void setItems(List<String> items) { this.items = items; }

    public double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(double totalAmount) { this.totalAmount = totalAmount; }

    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
}

// =========================================================================
// THREAD-SAFE IN-MEMORY REPOSITORY SERVICE
// =========================================================================

@org.springframework.stereotype.Service
class OrderRepositoryService {

    private final Map<String, OrderEntity> orderStore = new ConcurrentHashMap<>();

    public OrderRepositoryService() {
        // Seed default demo order for immediate dashboard viewing
        OrderEntity demo = new OrderEntity(
            "HH-104928",
            "Demo Customer",
            "+91 6396699104",
            "Civil Lines, Bareilly, UP",
            28.3670,
            79.4304,
            Arrays.asList("Royal Scented Soy Candle", "Artisanal Truffle Assortment"),
            1500.0
        );
        demo.setStatus(OrderStatus.PREPARING);
        orderStore.put(demo.getOrderId(), demo);
    }

    public OrderEntity save(OrderEntity order) {
        if (order.getOrderId() == null || order.getOrderId().trim().isEmpty()) {
            order.setOrderId("HH-" + (int)(100000 + Math.random() * 900000));
        }
        if (order.getTimestamp() == null) {
            order.setTimestamp(LocalDateTime.now().format(DateTimeFormatter.ofPattern("hh:mm:ss a, dd MMM yyyy")));
        }
        orderStore.put(order.getOrderId(), order);
        return order;
    }

    public Optional<OrderEntity> findById(String orderId) {
        return Optional.ofNullable(orderStore.get(orderId));
    }

    public List<OrderEntity> findAll() {
        return new ArrayList<>(orderStore.values());
    }

    public boolean updateStatus(String orderId, OrderStatus nextStatus) {
        OrderEntity existing = orderStore.get(orderId);
        if (existing != null) {
            existing.setStatus(nextStatus);
            return true;
        }
        return false;
    }
}

// =========================================================================
// REST API DISPATCH CONTROLLER
// =========================================================================

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
class OrderDispatchController {

    private final OrderRepositoryService orderService;

    public OrderDispatchController(OrderRepositoryService orderService) {
        this.orderService = orderService;
    }

    /**
     * Submit a new customer delivery order.
     */
    @PostMapping("/place")
    public ResponseEntity<?> placeOrder(@RequestBody OrderEntity incomingOrder) {
        if (incomingOrder.getCustomerName() == null || incomingOrder.getCustomerName().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Collections.singletonMap("error", "Customer name is mandatory"));
        }
        if (incomingOrder.getDeliveryAddress() == null || incomingOrder.getDeliveryAddress().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Collections.singletonMap("error", "Delivery address is mandatory"));
        }
        if (incomingOrder.getItems() == null || incomingOrder.getItems().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Collections.singletonMap("error", "Order cart cannot be empty"));
        }

        OrderEntity saved = orderService.save(incomingOrder);
        return ResponseEntity.ok(saved);
    }

    /**
     * Retrieve all active orders for the Admin Dispatch Board.
     */
    @GetMapping("/all")
    public ResponseEntity<List<OrderEntity>> retrieveAllOrders() {
        List<OrderEntity> orders = orderService.findAll();
        return ResponseEntity.ok(orders);
    }

    /**
     * Query order tracking information by ID.
     */
    @GetMapping("/track/{orderId}")
    public ResponseEntity<?> trackSingleOrder(@PathVariable String orderId) {
        Optional<OrderEntity> order = orderService.findById(orderId);
        if (order.isPresent()) {
            return ResponseEntity.ok(order.get());
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.singletonMap("error", "Order ID not found"));
    }

    /**
     * Admin status alteration endpoint (RECEIVED -> PREPARING -> OUT_FOR_DELIVERY -> DELIVERED).
     */
    @PostMapping("/update-status")
    public ResponseEntity<?> updateStatus(@RequestParam String orderId, @RequestParam String status) {
        try {
            OrderStatus next = OrderStatus.valueOf(status.toUpperCase().trim());
            boolean success = orderService.updateStatus(orderId, next);
            if (success) {
                return ResponseEntity.ok(orderService.findById(orderId).get());
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.singletonMap("error", "Target order was not found"));
            }
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Collections.singletonMap("error", "Invalid status code specified"));
        }
    }
}
